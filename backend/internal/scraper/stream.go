package scraper

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"mime"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var (
	ErrStreamUnsupported = errors.New("stream provider is not supported")
	ErrStreamUnavailable = errors.New("direct stream is unavailable")

	actionPattern      = regexp.MustCompile(`action:"([a-f0-9]{32})"`)
	directMediaPattern = regexp.MustCompile(`https://[^"'\\\s<>]+\.(?:mp4|webm|m3u8|mpd)(?:\?[^"'\\\s<>]*)?`)
)

const maxProviderBodyBytes = 1 << 20

type ajaxResponse struct {
	Success bool   `json:"success"`
	Data    string `json:"data"`
}

// ResolveStream resolves a source-owned server choice into a validated direct
// media URL. The server ID is matched against the freshly scraped episode, so
// callers cannot use this endpoint as an arbitrary URL fetcher.
func (s *Scraper) ResolveStream(ctx context.Context, slug, serverID string) (MediaStream, error) {
	if s == nil || !validSlug(slug) {
		return MediaStream{}, fmt.Errorf("%w: invalid episode slug", ErrInvalidRequest)
	}

	doc, episodeURL, err := s.fetch(ctx, "/episode/"+url.PathEscape(slug)+"/")
	if err != nil {
		return MediaStream{}, err
	}
	selection, server, err := findStreamSelection(doc, serverID)
	if err != nil {
		return MediaStream{}, err
	}
	if !server.Supported {
		return MediaStream{}, fmt.Errorf("%w: %s", ErrStreamUnsupported, server.Provider)
	}

	iframeURL, err := s.resolveMirror(ctx, doc, episodeURL, selection)
	if err != nil {
		return MediaStream{}, err
	}
	if !allowedProviderURL(iframeURL) {
		return MediaStream{}, fmt.Errorf("%w: provider host is not allowed", ErrStreamUnsupported)
	}

	directURL, err := fetchDirectMediaURL(ctx, iframeURL, episodeURL)
	if err != nil {
		return MediaStream{}, err
	}
	contentType, kind, err := validateDirectMedia(ctx, directURL)
	if err != nil {
		return MediaStream{}, err
	}
	return MediaStream{
		ServerID: server.ID, Provider: server.Provider, Quality: server.Quality,
		URL: directURL, Kind: kind, ContentType: contentType,
	}, nil
}

func findStreamSelection(doc *goquery.Document, serverID string) (mirrorPayload, StreamServer, error) {
	var selected mirrorPayload
	var server StreamServer
	found := false
	doc.Find(".mirrorstream a[data-content]").EachWithBreak(func(_ int, link *goquery.Selection) bool {
		encoded, _ := link.Attr("data-content")
		payload, err := decodeMirrorPayload(encoded)
		if err != nil {
			return true
		}
		id := payload.Quality + "-" + strconv.Itoa(payload.Index)
		if id != serverID {
			return true
		}
		provider := strings.ToLower(cleanText(link.Text()))
		_, isDefault := link.Attr("data-default")
		selected = payload
		server = StreamServer{ID: id, Provider: provider, Quality: payload.Quality, Default: isDefault, Supported: supportedStreamProvider(provider)}
		found = true
		return false
	})
	if !found {
		return mirrorPayload{}, StreamServer{}, fmt.Errorf("%w: stream server was not found", ErrInvalidRequest)
	}
	return selected, server, nil
}

func (s *Scraper) resolveMirror(ctx context.Context, doc *goquery.Document, episodeURL string, selection mirrorPayload) (string, error) {
	scripts := doc.Find("script").Map(func(_ int, script *goquery.Selection) string { return script.Text() })
	actions := actionPattern.FindAllStringSubmatch(strings.Join(scripts, "\n"), -1)
	if len(actions) < 2 {
		return "", fmt.Errorf("%w: mirror actions were not found", ErrInvalidContent)
	}
	nonceAction := actions[len(actions)-2][1]
	resolveAction := actions[len(actions)-1][1]

	nonce, err := s.postAJAX(ctx, episodeURL, url.Values{"action": {nonceAction}})
	if err != nil {
		return "", err
	}
	resolved, err := s.postAJAX(ctx, episodeURL, url.Values{
		"id": {strconv.Itoa(selection.PostID)}, "i": {strconv.Itoa(selection.Index)}, "q": {selection.Quality},
		"nonce": {nonce.Data}, "action": {resolveAction},
	})
	if err != nil {
		return "", err
	}
	embedHTML, err := base64.StdEncoding.DecodeString(resolved.Data)
	if err != nil {
		return "", fmt.Errorf("%w: decode mirror response", ErrInvalidContent)
	}
	embedDoc, err := goquery.NewDocumentFromReader(strings.NewReader(string(embedHTML)))
	if err != nil {
		return "", fmt.Errorf("%w: parse mirror response", ErrInvalidContent)
	}
	iframeURL, exists := embedDoc.Find("iframe[src]").First().Attr("src")
	if !exists {
		return "", fmt.Errorf("%w: mirror did not return a provider", ErrStreamUnavailable)
	}
	return html.UnescapeString(strings.TrimSpace(iframeURL)), nil
}

func (s *Scraper) postAJAX(ctx context.Context, referer string, values url.Values) (ajaxResponse, error) {
	target := s.baseURL.ResolveReference(&url.URL{Path: "/wp-admin/admin-ajax.php"})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, target.String(), strings.NewReader(values.Encode()))
	if err != nil {
		return ajaxResponse{}, fmt.Errorf("build mirror request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Referer", referer)
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; BelajarScraping/1.0)")
	response, err := s.client.Do(req)
	if err != nil {
		return ajaxResponse{}, fmt.Errorf("%w: resolve mirror: %v", ErrUpstream, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return ajaxResponse{}, fmt.Errorf("%w: mirror endpoint returned HTTP %d", ErrUpstream, response.StatusCode)
	}
	var payload ajaxResponse
	if err := json.NewDecoder(io.LimitReader(response.Body, maxProviderBodyBytes)).Decode(&payload); err != nil || payload.Data == "" {
		return ajaxResponse{}, fmt.Errorf("%w: invalid mirror response", ErrInvalidContent)
	}
	return payload, nil
}

func allowedProviderURL(rawURL string) bool {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" || parsed.User != nil {
		return false
	}
	return strings.EqualFold(parsed.Hostname(), "desustream.net") || strings.HasSuffix(strings.ToLower(parsed.Hostname()), ".desustream.net")
}

func fetchDirectMediaURL(ctx context.Context, providerURL, referer string) (string, error) {
	client := restrictedClient(allowedProviderURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, providerURL, nil)
	if err != nil {
		return "", fmt.Errorf("build provider request: %w", err)
	}
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	req.Header.Set("Referer", referer)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; BelajarScraping/1.0)")
	response, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: fetch provider: %v", ErrStreamUnavailable, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK || !strings.Contains(response.Header.Get("Content-Type"), "text/html") {
		return "", fmt.Errorf("%w: provider returned an invalid response", ErrStreamUnavailable)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, maxProviderBodyBytes+1))
	if err != nil || len(body) > maxProviderBodyBytes {
		return "", fmt.Errorf("%w: provider page could not be read", ErrStreamUnavailable)
	}
	match := directMediaPattern.FindString(html.UnescapeString(string(body)))
	if match == "" || !allowedMediaURL(match) {
		return "", fmt.Errorf("%w: provider does not expose a supported direct media URL", ErrStreamUnsupported)
	}
	return match, nil
}

func allowedMediaURL(rawURL string) bool {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" || parsed.User != nil {
		return false
	}
	host := strings.ToLower(parsed.Hostname())
	return host == "cdn.odcloud.net" || host == "archive.org" || strings.HasSuffix(host, ".archive.org")
}

func validateDirectMedia(ctx context.Context, rawURL string) (string, string, error) {
	client := restrictedClient(allowedMediaURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodHead, rawURL, nil)
	if err != nil {
		return "", "", fmt.Errorf("build media request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; BelajarScraping/1.0)")
	response, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("%w: validate media: %v", ErrStreamUnavailable, err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 400 {
		return "", "", fmt.Errorf("%w: media returned HTTP %d", ErrStreamUnavailable, response.StatusCode)
	}
	contentType, _, _ := mime.ParseMediaType(response.Header.Get("Content-Type"))
	switch strings.ToLower(contentType) {
	case "video/mp4", "video/webm":
		return contentType, "file", nil
	case "application/vnd.apple.mpegurl", "application/x-mpegurl":
		return contentType, "hls", nil
	case "application/dash+xml":
		return contentType, "dash", nil
	default:
		return "", "", fmt.Errorf("%w: media content type is not supported", ErrStreamUnsupported)
	}
}

func restrictedClient(allow func(string) bool) *http.Client {
	return &http.Client{
		Timeout: 20 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 || !allow(req.URL.String()) {
				return fmt.Errorf("redirect target is not allowed")
			}
			return nil
		},
	}
}
