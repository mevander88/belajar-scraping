package scraper

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/PuerkitoBio/goquery"
)

const (
	defaultBaseURL = "https://otakudesu.blog"
	maxBodyBytes   = 5 << 20
)

var (
	ErrInvalidRequest = errors.New("invalid scraping request")
	ErrNotFound       = errors.New("source content not found")
	ErrUpstream       = errors.New("source request failed")
	ErrInvalidContent = errors.New("source content is invalid")
)

type Scraper struct {
	baseURL *url.URL
	client  *http.Client
	mu      sync.Mutex
	lastHit time.Time
	delay   time.Duration
}

func New() *Scraper {
	scraper, _ := NewWithConfig(defaultBaseURL, &http.Client{Timeout: 20 * time.Second}, 750*time.Millisecond)
	return scraper
}

func NewWithConfig(baseURL string, client *http.Client, delay time.Duration) (*Scraper, error) {
	parsedBaseURL, err := url.Parse(baseURL)
	if err != nil || parsedBaseURL.Scheme == "" || parsedBaseURL.Hostname() == "" {
		return nil, fmt.Errorf("invalid source URL %q", baseURL)
	}
	if client == nil {
		client = &http.Client{Timeout: 20 * time.Second}
	}
	clientCopy := *client
	originalRedirectPolicy := client.CheckRedirect
	clientCopy.CheckRedirect = func(request *http.Request, via []*http.Request) error {
		if !strings.EqualFold(request.URL.Scheme, parsedBaseURL.Scheme) || !strings.EqualFold(request.URL.Host, parsedBaseURL.Host) {
			return fmt.Errorf("redirect outside source domain is not allowed")
		}
		if originalRedirectPolicy != nil {
			return originalRedirectPolicy(request, via)
		}
		if len(via) >= 10 {
			return fmt.Errorf("stopped after 10 redirects")
		}
		return nil
	}
	return &Scraper{baseURL: parsedBaseURL, client: &clientCopy, delay: delay}, nil
}

func (s *Scraper) Run(ctx context.Context, request Request) (Response, error) {
	if request.Kind == KindSearch {
		request.Query = NormalizeSearchQuery(request.Query)
	}
	if err := ValidateRequest(request); err != nil {
		return Response{}, err
	}

	var (
		data      any
		sourceURL string
		count     int
		err       error
	)

	switch request.Kind {
	case KindHome:
		data, sourceURL, count, err = s.home(ctx)
	case KindCatalog:
		data, sourceURL, count, err = s.catalog(ctx)
	case KindSchedule:
		data, sourceURL, count, err = s.schedule(ctx)
	case KindGenres:
		data, sourceURL, count, err = s.genres(ctx)
	case KindOngoing:
		data, sourceURL, count, err = s.collection(ctx, "/ongoing-anime/", request.Page, "ongoing")
	case KindComplete:
		data, sourceURL, count, err = s.collection(ctx, "/complete-anime/", request.Page, "complete")
	case KindGenre:
		data, sourceURL, count, err = s.collection(ctx, "/genres/"+url.PathEscape(request.Slug)+"/", request.Page, "")
	case KindAnime:
		data, sourceURL, count, err = s.anime(ctx, request.Slug)
	case KindEpisode:
		data, sourceURL, count, err = s.episode(ctx, request.Slug)
	case KindSearch:
		data, sourceURL, count, err = s.search(ctx, request.Query)
	default:
		return Response{}, fmt.Errorf("%w: unsupported kind %q", ErrInvalidRequest, request.Kind)
	}
	if err != nil {
		return Response{}, err
	}

	response := Response{
		Meta: Meta{Kind: request.Kind, SourceURL: sourceURL, FetchedAt: time.Now().UTC(), Count: count},
		Data: data,
	}
	if err := validateResponse(response); err != nil {
		return Response{}, err
	}
	return response, nil
}

func (s *Scraper) fetch(ctx context.Context, rawPath string) (*goquery.Document, string, error) {
	target, err := s.resolve(rawPath)
	if err != nil {
		return nil, "", err
	}

	s.mu.Lock()
	wait := s.delay - time.Since(s.lastHit)
	if wait > 0 {
		timer := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			timer.Stop()
			s.mu.Unlock()
			return nil, "", ctx.Err()
		case <-timer.C:
		}
	}
	s.lastHit = time.Now()
	s.mu.Unlock()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		return nil, "", fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; OtakudesuStructureDebugger/1.0; local-development)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	response, err := s.client.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("%w: fetch %s: %w", ErrUpstream, target, err)
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusNotFound {
		return nil, "", fmt.Errorf("%w: %s", ErrNotFound, target)
	}
	if response.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("%w: %s returned HTTP %d", ErrUpstream, target, response.StatusCode)
	}
	if contentType := response.Header.Get("Content-Type"); !strings.Contains(contentType, "text/html") {
		return nil, "", fmt.Errorf("%w: %s returned content type %q", ErrUpstream, target, contentType)
	}

	limited := io.LimitReader(response.Body, maxBodyBytes+1)
	body, err := io.ReadAll(limited)
	if err != nil {
		return nil, "", fmt.Errorf("%w: read %s: %w", ErrUpstream, target, err)
	}
	if len(body) > maxBodyBytes {
		return nil, "", fmt.Errorf("%w: response from %s exceeds %d bytes", ErrUpstream, target, maxBodyBytes)
	}
	document, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, "", fmt.Errorf("%w: parse %s: %v", ErrInvalidContent, target, err)
	}
	return document, response.Request.URL.String(), nil
}

func (s *Scraper) resolve(rawPath string) (*url.URL, error) {
	target, err := url.Parse(rawPath)
	if err != nil {
		return nil, fmt.Errorf("parse path: %w", err)
	}
	if !target.IsAbs() {
		target = s.baseURL.ResolveReference(target)
	}
	if !strings.EqualFold(target.Scheme, s.baseURL.Scheme) || !strings.EqualFold(target.Host, s.baseURL.Host) {
		return nil, fmt.Errorf("only %s is allowed", s.baseURL.String())
	}
	return target, nil
}

func (s *Scraper) home(ctx context.Context) (any, string, int, error) {
	doc, sourceURL, err := s.fetch(ctx, "/")
	if err != nil {
		return nil, "", 0, err
	}
	result := HomeData{Ongoing: []AnimeCard{}, Complete: []AnimeCard{}}
	doc.Find(".venz").Each(func(_ int, section *goquery.Selection) {
		heading := cleanText(section.Prev().Find(".rvad h1").First().Text())
		if heading == "" {
			heading = cleanText(section.PrevAll().Find(".rvad h1").First().Text())
		}
		cards := parseCards(section, "")
		switch {
		case strings.Contains(strings.ToLower(heading), "on-going") || strings.Contains(strings.ToLower(heading), "ongoing"):
			for i := range cards {
				cards[i].Status = "ongoing"
			}
			result.Ongoing = append(result.Ongoing, cards...)
		case strings.Contains(strings.ToLower(heading), "complete"):
			for i := range cards {
				cards[i].Status = "complete"
			}
			result.Complete = append(result.Complete, cards...)
		}
	})
	return result, sourceURL, len(result.Ongoing) + len(result.Complete), nil
}

func (s *Scraper) catalog(ctx context.Context) (any, string, int, error) {
	doc, sourceURL, err := s.fetch(ctx, "/anime-list/")
	if err != nil {
		return nil, "", 0, err
	}
	items := make([]CatalogItem, 0, 1000)
	doc.Find(".jdlbar a.hodebgst").Each(func(_ int, link *goquery.Selection) {
		fullText := cleanText(link.Text())
		clone := link.Clone()
		clone.Find("span, color").Remove()
		title := cleanText(clone.Text())
		href, _ := link.Attr("href")
		status := "complete"
		if strings.Contains(strings.ToLower(fullText), "on-going") || strings.Contains(strings.ToLower(fullText), "ongoing") {
			status = "ongoing"
		}
		items = append(items, CatalogItem{Slug: slugFromURL(href), Title: title, URL: href, Status: status})
	})
	return items, sourceURL, len(items), nil
}

func (s *Scraper) schedule(ctx context.Context) (any, string, int, error) {
	doc, sourceURL, err := s.fetch(ctx, "/jadwal-rilis/")
	if err != nil {
		return nil, "", 0, err
	}
	groups := make([]ScheduleGroup, 0, 7)
	total := 0
	doc.Find(".kglist321").Each(func(_ int, section *goquery.Selection) {
		group := ScheduleGroup{Day: cleanText(section.Find("h2").First().Text()), Items: []CatalogItem{}}
		section.Find("li a").Each(func(_ int, link *goquery.Selection) {
			href, _ := link.Attr("href")
			group.Items = append(group.Items, CatalogItem{Slug: slugFromURL(href), Title: cleanText(link.Text()), URL: href, Status: "ongoing"})
		})
		if group.Day != "" {
			total += len(group.Items)
			groups = append(groups, group)
		}
	})
	return groups, sourceURL, total, nil
}

func (s *Scraper) genres(ctx context.Context) (any, string, int, error) {
	doc, sourceURL, err := s.fetch(ctx, "/genre-list/")
	if err != nil {
		return nil, "", 0, err
	}
	items := make([]Genre, 0, 50)
	doc.Find(".genres a").Each(func(_ int, link *goquery.Selection) {
		href, _ := link.Attr("href")
		absolute := s.baseURL.ResolveReference(mustParseURL(href)).String()
		items = append(items, Genre{Slug: slugFromURL(href), Name: cleanText(link.Text()), URL: absolute})
	})
	return items, sourceURL, len(items), nil
}

func (s *Scraper) collection(ctx context.Context, basePath string, pageNumber int, status string) (any, string, int, error) {
	requestPath := basePath
	if pageNumber > 1 {
		requestPath = strings.TrimSuffix(basePath, "/") + "/page/" + strconv.Itoa(pageNumber) + "/"
	}
	doc, sourceURL, err := s.fetch(ctx, requestPath)
	if err != nil {
		return nil, "", 0, err
	}
	items := parseCards(doc.Selection, status)
	if strings.HasPrefix(basePath, "/genres/") {
		items = parseGenreCards(doc.Selection)
	}
	result := AnimeCollection{Items: items, Pagination: parsePagination(doc, pageNumber)}
	return result, sourceURL, len(items), nil
}

func (s *Scraper) anime(ctx context.Context, slug string) (any, string, int, error) {
	doc, sourceURL, err := s.fetch(ctx, "/anime/"+url.PathEscape(slug)+"/")
	if err != nil {
		return nil, "", 0, err
	}
	detail := parseAnimeDetail(doc, sourceURL)
	return detail, sourceURL, len(detail.Episodes) + len(detail.Batches), nil
}

func (s *Scraper) episode(ctx context.Context, slug string) (any, string, int, error) {
	doc, sourceURL, err := s.fetch(ctx, "/episode/"+url.PathEscape(slug)+"/")
	if err != nil {
		return nil, "", 0, err
	}
	detail := parseEpisodeDetail(doc, sourceURL)
	return detail, sourceURL, len(detail.Downloads), nil
}

func (s *Scraper) search(ctx context.Context, query string) (any, string, int, error) {
	params := url.Values{"s": {query}, "post_type": {"anime"}}
	doc, sourceURL, err := s.fetch(ctx, "/?"+params.Encode())
	if err != nil {
		return nil, "", 0, err
	}
	pageTitle := strings.ToLower(cleanText(doc.Find("title").First().Text()))
	heading := strings.ToLower(cleanText(doc.Find(".rvad h1").First().Text()))
	if (!strings.Contains(pageTitle, "you searched for") && !strings.Contains(heading, "hasil pencarian")) || doc.Find(".chivsrc").Length() == 0 {
		return nil, "", 0, fmt.Errorf("%w: search page marker was not found", ErrInvalidContent)
	}
	items := parseSearchResults(doc.Selection)
	if len(items) > 12 {
		items = items[:12]
	}
	result := SearchData{Query: query, MaxResults: 12, Items: items}
	return result, sourceURL, len(items), nil
}

func parseCards(root *goquery.Selection, status string) []AnimeCard {
	items := []AnimeCard{}
	root.Find(".detpost").Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".thumb a").First()
		href, _ := link.Attr("href")
		cover, _ := card.Find("img").First().Attr("src")
		episodeText := cleanText(card.Find(".epz").Text())
		scheduleOrScore := cleanText(card.Find(".epztipe").Text())
		item := AnimeCard{
			Slug: slugFromURL(href), Title: cleanText(card.Find(".jdlflm").Text()), URL: href,
			CoverURL: cover, EpisodeText: episodeText, UpdatedText: cleanText(card.Find(".newnime").Text()), Status: status,
		}
		if looksNumeric(scheduleOrScore) {
			item.Score = scheduleOrScore
		} else {
			item.ScheduleText = scheduleOrScore
		}
		items = append(items, item)
	})
	return items
}

func parseGenreCards(root *goquery.Selection) []AnimeCard {
	items := []AnimeCard{}
	root.Find(".col-anime-con").Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".col-anime-title a").First()
		href, _ := link.Attr("href")
		cover, _ := card.Find(".col-anime-cover img").First().Attr("src")
		item := AnimeCard{
			Slug:        slugFromURL(href),
			Title:       cleanText(link.Text()),
			URL:         href,
			CoverURL:    cover,
			EpisodeText: cleanText(card.Find(".col-anime-eps").Text()),
			Score:       cleanText(card.Find(".col-anime-rating").Text()),
			Studio:      cleanText(card.Find(".col-anime-studio").Text()),
			ReleaseText: cleanText(card.Find(".col-anime-date").Text()),
			Synopsis:    cleanText(card.Find(".col-synopsis").Text()),
			Genres:      []Genre{},
		}
		card.Find(".col-anime-genre a").Each(func(_ int, genreLink *goquery.Selection) {
			genreURL, _ := genreLink.Attr("href")
			item.Genres = append(item.Genres, Genre{
				Slug: slugFromURL(genreURL),
				Name: cleanText(genreLink.Text()),
				URL:  genreURL,
			})
		})
		if item.Title != "" && item.URL != "" {
			items = append(items, item)
		}
	})
	return items
}

func parseSearchResults(root *goquery.Selection) []AnimeCard {
	items := []AnimeCard{}
	root.Find(".chivsrc > li").Each(func(_ int, row *goquery.Selection) {
		link := row.Find("h2 a").First()
		href, _ := link.Attr("href")
		cover, _ := row.Find("img").First().Attr("src")
		item := AnimeCard{
			Slug: slugFromURL(href), Title: cleanText(link.Text()), URL: href,
			CoverURL: cover, Genres: []Genre{},
		}
		row.Find(".set").Each(func(_ int, field *goquery.Selection) {
			label := strings.ToLower(cleanText(field.Find("b").First().Text()))
			clone := field.Clone()
			clone.Find("b").First().Remove()
			value := strings.TrimSpace(strings.TrimPrefix(cleanText(clone.Text()), ":"))
			switch label {
			case "genres", "genre":
				field.Find("a").Each(func(_ int, genreLink *goquery.Selection) {
					genreURL, _ := genreLink.Attr("href")
					item.Genres = append(item.Genres, Genre{Slug: slugFromURL(genreURL), Name: cleanText(genreLink.Text()), URL: genreURL})
				})
			case "status":
				item.Status = normalizeStatus(value)
			case "rating":
				item.Score = value
			}
		})
		if item.Title != "" && item.URL != "" {
			items = append(items, item)
		}
	})
	return items
}

func parsePagination(doc *goquery.Document, current int) Pagination {
	result := Pagination{Current: current, Last: current}
	doc.Find(".page-numbers").Each(func(_ int, item *goquery.Selection) {
		text := cleanText(item.Text())
		if number, err := strconv.Atoi(text); err == nil && number > result.Last {
			result.Last = number
		}
		classes, _ := item.Attr("class")
		href, _ := item.Attr("href")
		if strings.Contains(classes, "next") {
			result.Next = href
		}
		if strings.Contains(classes, "prev") {
			result.Previous = href
		}
	})
	return result
}

func parseAnimeDetail(doc *goquery.Document, sourceURL string) AnimeDetail {
	detail := AnimeDetail{Slug: slugFromURL(sourceURL), URL: sourceURL, Genres: []Genre{}, Episodes: []EpisodeSummary{}, Batches: []EpisodeSummary{}}
	detail.CoverURL, _ = doc.Find(".fotoanime img").First().Attr("src")
	values := map[string]string{}
	doc.Find(".infozingle p").Each(func(_ int, row *goquery.Selection) {
		label := strings.ToLower(strings.TrimSpace(row.Find("b").First().Text()))
		clone := row.Clone()
		clone.Find("b").First().Remove()
		value := strings.TrimSpace(strings.TrimPrefix(cleanText(clone.Text()), ":"))
		values[label] = value
	})
	detail.Title = values["judul"]
	detail.TitleJapan = values["japanese"]
	detail.Score = values["skor"]
	detail.Producer = values["produser"]
	detail.Type = values["tipe"]
	detail.Status = normalizeStatus(values["status"])
	detail.TotalEpisodes = values["total episode"]
	detail.Duration = values["durasi"]
	detail.ReleaseDateRaw = values["tanggal rilis"]
	detail.ReleaseDate = normalizeDate(values["tanggal rilis"])
	detail.Studio = values["studio"]
	detail.Synopsis = cleanText(doc.Find(".sinopc").Text())
	doc.Find(".infozingle p").FilterFunction(func(_ int, row *goquery.Selection) bool {
		return strings.EqualFold(cleanText(row.Find("b").Text()), "Genre")
	}).Find("a").Each(func(_ int, link *goquery.Selection) {
		href, _ := link.Attr("href")
		detail.Genres = append(detail.Genres, Genre{Slug: slugFromURL(href), Name: cleanText(link.Text()), URL: href})
	})
	doc.Find(".episodelist").Each(func(_ int, list *goquery.Selection) {
		heading := strings.ToLower(cleanText(list.Find(".monktit").Text()))
		list.Find("li").Each(func(_ int, row *goquery.Selection) {
			link := row.Find("a").First()
			href, exists := link.Attr("href")
			if !exists {
				return
			}
			item := EpisodeSummary{Slug: slugFromURL(href), Title: cleanText(link.Text()), URL: href, ReleaseText: cleanText(row.Find(".zeebr").Text())}
			if strings.Contains(heading, "batch") || strings.Contains(href, "/batch/") {
				detail.Batches = append(detail.Batches, item)
			} else if strings.Contains(href, "/episode/") {
				detail.Episodes = append(detail.Episodes, item)
			}
		})
	})
	return detail
}

func parseEpisodeDetail(doc *goquery.Document, sourceURL string) EpisodeDetail {
	detail := EpisodeDetail{Slug: slugFromURL(sourceURL), URL: sourceURL, Title: cleanText(doc.Find("h1.posttl").Text()), Streams: []Stream{}, Episodes: []EpisodeSummary{}, Downloads: []DownloadGroup{}}
	detail.PosterURL, _ = doc.Find("img.attachment-post-thumbnail").First().Attr("src")
	doc.Find(".responsive-embed-stream iframe").Each(func(_ int, frame *goquery.Selection) {
		href, _ := frame.Attr("src")
		detail.Streams = append(detail.Streams, Stream{Provider: hostFromURL(href), URL: href})
	})
	doc.Find("#selectcog option").Each(func(_ int, option *goquery.Selection) {
		href, _ := option.Attr("value")
		if !strings.HasPrefix(href, "http") {
			return
		}
		detail.Episodes = append(detail.Episodes, EpisodeSummary{Slug: slugFromURL(href), Title: cleanText(option.Text()), URL: href})
	})
	doc.Find(".download li").Each(func(_ int, row *goquery.Selection) {
		group := DownloadGroup{Label: cleanText(row.Find("strong").First().Text()), Size: cleanText(row.Find("i").First().Text()), Links: []DownloadLink{}}
		row.Find("a[href]").Each(func(_ int, link *goquery.Selection) {
			href, _ := link.Attr("href")
			group.Links = append(group.Links, DownloadLink{Provider: cleanText(link.Text()), URL: href})
		})
		if group.Label != "" {
			detail.Downloads = append(detail.Downloads, group)
		}
	})
	return detail
}

func slugFromURL(raw string) string {
	parsed := mustParseURL(raw)
	return path.Base(strings.TrimSuffix(parsed.Path, "/"))
}

func hostFromURL(raw string) string {
	parsed := mustParseURL(raw)
	return parsed.Hostname()
}

func mustParseURL(raw string) *url.URL {
	parsed, _ := url.Parse(raw)
	return parsed
}

func cleanText(value string) string {
	return strings.Join(strings.Fields(strings.ReplaceAll(value, "\u00a0", " ")), " ")
}

var numericPattern = regexp.MustCompile(`^[0-9]+(?:\.[0-9]+)?$`)

func validSlug(slug string) bool {
	if slug == "" || slug == "." || slug == ".." || !utf8.ValidString(slug) {
		return false
	}

	for index, character := range slug {
		if index == 0 && !unicode.IsLetter(character) && !unicode.IsDigit(character) {
			return false
		}
		if unicode.IsLetter(character) || unicode.IsDigit(character) || unicode.IsMark(character) || unicode.IsSymbol(character) || character == '-' {
			continue
		}
		return false
	}
	return true
}

func NormalizeSearchQuery(query string) string {
	return strings.Join(strings.Fields(query), " ")
}

func ValidateRequest(request Request) error {
	if request.Kind != KindSearch && request.Query != "" {
		return fmt.Errorf("%w: query is only supported for search", ErrInvalidRequest)
	}
	switch request.Kind {
	case KindHome, KindCatalog, KindSchedule, KindGenres, KindOngoing, KindComplete:
		if request.Slug != "" {
			return fmt.Errorf("%w: slug is not supported for %s", ErrInvalidRequest, request.Kind)
		}
	case KindGenre, KindAnime, KindEpisode:
		if !validSlug(request.Slug) {
			return fmt.Errorf("%w: a valid slug is required for %s", ErrInvalidRequest, request.Kind)
		}
	case KindSearch:
		if request.Slug != "" || NormalizeSearchQuery(request.Query) == "" || request.Page != 1 {
			return fmt.Errorf("%w: a query and no pagination are required for search", ErrInvalidRequest)
		}
	default:
		return fmt.Errorf("%w: unsupported kind %q", ErrInvalidRequest, request.Kind)
	}
	if request.Page < 1 {
		return fmt.Errorf("%w: page must be greater than zero", ErrInvalidRequest)
	}
	return nil
}

func validateResponse(response Response) error {
	valid := false
	switch response.Meta.Kind {
	case KindHome:
		data, ok := response.Data.(HomeData)
		valid = ok && len(data.Ongoing)+len(data.Complete) > 0
	case KindCatalog:
		data, ok := response.Data.([]CatalogItem)
		valid = ok && len(data) > 0
	case KindSchedule:
		data, ok := response.Data.([]ScheduleGroup)
		valid = ok && len(data) > 0
	case KindGenres:
		data, ok := response.Data.([]Genre)
		valid = ok && len(data) > 0
	case KindOngoing, KindComplete, KindGenre:
		data, ok := response.Data.(AnimeCollection)
		valid = ok && len(data.Items) > 0
	case KindAnime:
		data, ok := response.Data.(AnimeDetail)
		valid = ok && data.Title != "" && data.Slug != ""
	case KindEpisode:
		data, ok := response.Data.(EpisodeDetail)
		valid = ok && data.Title != "" && data.Slug != ""
	case KindSearch:
		data, ok := response.Data.(SearchData)
		valid = ok && data.Query != "" && data.MaxResults == 12 && data.Items != nil
	}
	if !valid {
		return fmt.Errorf("%w: required fields for %s were not found", ErrInvalidContent, response.Meta.Kind)
	}
	return nil
}

func looksNumeric(value string) bool {
	return numericPattern.MatchString(strings.TrimSpace(value))
}

func normalizeStatus(value string) string {
	lower := strings.ToLower(strings.TrimSpace(value))
	switch {
	case strings.Contains(lower, "ongoing"), strings.Contains(lower, "on-going"):
		return "ongoing"
	case strings.Contains(lower, "complete"), strings.Contains(lower, "completed"):
		return "complete"
	default:
		return lower
	}
}

func normalizeDate(value string) string {
	months := map[string]string{"jan": "Jan", "feb": "Feb", "mar": "Mar", "apr": "Apr", "mei": "May", "jun": "Jun", "jul": "Jul", "agu": "Aug", "sep": "Sep", "okt": "Oct", "nov": "Nov", "des": "Dec"}
	parts := strings.Fields(strings.ReplaceAll(value, ",", " "))
	if len(parts) != 3 {
		return ""
	}
	month, ok := months[strings.ToLower(parts[0])]
	if !ok {
		return ""
	}
	parsed, err := time.Parse("Jan 02 2006", month+" "+parts[1]+" "+parts[2])
	if err != nil {
		return ""
	}
	return parsed.Format(time.DateOnly)
}
