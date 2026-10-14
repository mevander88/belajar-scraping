package scraper

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/PuerkitoBio/goquery"
)

func TestParseHomeSections(t *testing.T) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(`
		<a><div class="rvad"><h1>On-going Anime</h1></div></a>
		<div class="venz"><div class="detpost"><div class="thumb"><a href="https://otakudesu.blog/anime/ongoing/"><img src="ongoing.jpg"></a></div><div class="jdlflm">Ongoing</div></div></div>
		<a><div class="rvad"><h1>Complete Anime</h1></div></a>
		<div class="venz"><div class="detpost"><div class="thumb"><a href="https://otakudesu.blog/anime/complete/"><img src="complete.jpg"></a></div><div class="jdlflm">Complete</div></div></div>`))
	if err != nil {
		t.Fatal(err)
	}

	var headings []string
	doc.Find(".venz").Each(func(_ int, section *goquery.Selection) {
		headings = append(headings, cleanText(section.Prev().Find(".rvad h1").First().Text()))
	})
	if !reflect.DeepEqual(headings, []string{"On-going Anime", "Complete Anime"}) {
		t.Fatalf("unexpected section headings: %#v", headings)
	}
}

func TestParseGenreCards(t *testing.T) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(`
		<div class="col-anime-con"><div class="col-anime">
			<div class="col-anime-title"><a href="https://otakudesu.blog/anime/example/">Example</a></div>
			<div class="col-anime-studio">Studio A</div><div class="col-anime-eps">12 Eps</div>
			<div class="col-anime-rating">8.10</div><div class="col-anime-genre"><a href="https://otakudesu.blog/genres/action/">Action</a></div>
			<div class="col-anime-cover"><img src="cover.jpg"></div><div class="col-synopsis">Synopsis.</div><div class="col-anime-date">Fall 2026</div>
		</div></div>`))
	if err != nil {
		t.Fatal(err)
	}

	items := parseGenreCards(doc.Selection)
	if len(items) != 1 || items[0].Slug != "example" || items[0].Studio != "Studio A" || items[0].Score != "8.10" {
		t.Fatalf("unexpected genre cards: %#v", items)
	}
	if len(items[0].Genres) != 1 || items[0].Genres[0].Slug != "action" {
		t.Fatalf("unexpected card genres: %#v", items[0].Genres)
	}
}

func TestParseSearchResults(t *testing.T) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(`
		<ul class="chivsrc">
			<li>
				<img src="https://otakudesu.blog/wp-content/uploads/boruto.jpg">
				<h2><a href="https://otakudesu.blog/anime/borot-sub-indo/">Boruto Subtitle Indonesia</a></h2>
				<div class="set"><b>Genres</b> : <a href="https://otakudesu.blog/genres/action/">Action</a></div>
				<div class="set"><b>Status</b> : Drop</div>
				<div class="set"><b>Rating</b> : 6.15</div>
			</li>
			<li><h2>Item tanpa tautan</h2></li>
		</ul>`))
	if err != nil {
		t.Fatal(err)
	}

	items := parseSearchResults(doc.Selection)
	if len(items) != 1 {
		t.Fatalf("expected one valid result, got %#v", items)
	}
	item := items[0]
	if item.Slug != "borot-sub-indo" || item.Status != "drop" || item.Score != "6.15" || len(item.Genres) != 1 {
		t.Fatalf("unexpected search result: %#v", item)
	}
}

func TestRunSearchUsesEncodedQueryAndAcceptsEmptyResults(t *testing.T) {
	var receivedQuery url.Values
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		receivedQuery = request.URL.Query()
		response.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = response.Write([]byte(`<title>You searched for one piece | Otaku Desu</title><ul class="chivsrc"></ul>`))
	}))
	defer server.Close()

	source, err := NewWithConfig(server.URL, server.Client(), 0)
	if err != nil {
		t.Fatal(err)
	}
	response, err := source.Run(context.Background(), Request{Kind: KindSearch, Query: "  one   piece  ", Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if receivedQuery.Get("s") != "one piece" || receivedQuery.Get("post_type") != "anime" {
		t.Fatalf("unexpected source query: %v", receivedQuery)
	}
	data, ok := response.Data.(SearchData)
	if !ok || data.Query != "one piece" || len(data.Items) != 0 || data.MaxResults != 12 {
		t.Fatalf("unexpected empty search response: %#v", response.Data)
	}
}

func TestRunSearchRejectsPageWithoutSearchMarker(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
		response.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = response.Write([]byte(`<title>Otaku Desu</title><div class="detpost"></div>`))
	}))
	defer server.Close()

	source, err := NewWithConfig(server.URL, server.Client(), 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = source.Run(context.Background(), Request{Kind: KindSearch, Query: "naruto", Page: 1})
	if !errors.Is(err, ErrInvalidContent) {
		t.Fatalf("expected invalid content error, got %v", err)
	}
}

func TestValidateSearchRequest(t *testing.T) {
	valid := Request{Kind: KindSearch, Query: "naruto", Page: 1}
	if err := ValidateRequest(valid); err != nil {
		t.Fatalf("expected valid search request, got %v", err)
	}
	for _, request := range []Request{
		{Kind: KindSearch, Query: "   ", Page: 1},
		{Kind: KindSearch, Query: "naruto", Slug: "unexpected", Page: 1},
		{Kind: KindSearch, Query: "naruto", Page: 2},
		{Kind: KindSearch, Query: strings.Repeat("a", MaxSearchQueryRunes+1), Page: 1},
	} {
		if !errors.Is(ValidateRequest(request), ErrInvalidRequest) {
			t.Fatalf("expected invalid search request: %#v", request)
		}
	}
}

func TestValidateRequestRejectsOversizedPageAndSlug(t *testing.T) {
	for _, request := range []Request{
		{Kind: KindOngoing, Page: MaxPage + 1},
		{Kind: KindAnime, Slug: strings.Repeat("a", MaxSlugRunes+1), Page: 1},
	} {
		if !errors.Is(ValidateRequest(request), ErrInvalidRequest) {
			t.Fatalf("expected invalid request: %#v", request)
		}
	}
}

func TestParseAnimeDetail(t *testing.T) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(`
		<div class="fotoanime"><img src="https://example.test/cover.jpg"></div>
		<div class="infozingle">
			<p><span><b>Judul</b>: Example Anime</span></p>
			<p><span><b>Japanese</b>: 例</span></p>
			<p><span><b>Status</b>: On-Going</span></p>
			<p><span><b>Tanggal Rilis</b>: Okt 07, 2026</span></p>
			<p><span><b>Genre</b>: <a href="https://otakudesu.blog/genres/action/">Action</a></span></p>
		</div>
		<div class="sinopc"><p>A short synopsis.</p></div>
		<div class="episodelist"><span class="monktit">Example Episode List</span><ul>
			<li><span><a href="https://otakudesu.blog/episode/example-episode-1/">Episode 1</a></span><span class="zeebr">7 Oktober, 2026</span></li>
		</ul></div>`))
	if err != nil {
		t.Fatal(err)
	}

	detail := parseAnimeDetail(doc, "https://otakudesu.blog/anime/example-anime/")
	if detail.Title != "Example Anime" || detail.Status != "ongoing" {
		t.Fatalf("unexpected anime identity: %#v", detail)
	}
	if detail.ReleaseDate != "2026-10-07" {
		t.Fatalf("expected normalized date, got %q", detail.ReleaseDate)
	}
	if len(detail.Genres) != 1 || detail.Genres[0].Slug != "action" {
		t.Fatalf("unexpected genres: %#v", detail.Genres)
	}
	if len(detail.Episodes) != 1 || detail.Episodes[0].Slug != "example-episode-1" {
		t.Fatalf("unexpected episodes: %#v", detail.Episodes)
	}
}

func TestParseEpisodeDetail(t *testing.T) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(`
		<h1 class="posttl">Example Episode 1</h1>
		<div class="responsive-embed-stream"><iframe src="https://stream.example.test/embed/1"></iframe></div>
		<div class="mirrorstream">
			<a data-content="eyJpZCI6MTIzLCJpIjowLCJxIjoiNDgwcCJ9" data-default="true">odcdn</a>
			<a data-content="eyJpZCI6MTIzLCJpIjoxLCJxIjoiNDgwcCJ9">mega</a>
		</div>
		<select id="selectcog"><option value="0">Select</option><option value="https://otakudesu.blog/episode/example-1/">Episode 1</option></select>
		<div class="download"><ul><li><strong>Mp4 720p</strong><a href="https://download.example.test/1">Provider</a><i>100 MB</i></li></ul></div>`))
	if err != nil {
		t.Fatal(err)
	}

	detail := parseEpisodeDetail(doc, "https://otakudesu.blog/episode/example-1/")
	if len(detail.Servers) != 2 || detail.Servers[0].ID != "480p-0" || !detail.Servers[0].Supported || detail.Servers[1].Supported {
		t.Fatalf("unexpected servers: %#v", detail.Servers)
	}
	if len(detail.Downloads) != 1 || detail.Downloads[0].Label != "Mp4 720p" {
		t.Fatalf("unexpected downloads: %#v", detail.Downloads)
	}
}

func TestFindStreamSelectionRejectsUnknownServer(t *testing.T) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(`<div class="mirrorstream"><a data-content="eyJpZCI6MTIzLCJpIjowLCJxIjoiNDgwcCJ9">odcdn</a></div>`))
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := findStreamSelection(doc, "720p-9"); !errors.Is(err, ErrInvalidRequest) {
		t.Fatalf("expected invalid request, got %v", err)
	}
}

func TestDirectMediaAllowlistRejectsEmbedAndUnknownHosts(t *testing.T) {
	if allowedMediaURL("https://desustream.net/embed/player") {
		t.Fatal("expected HTML embed URL to be rejected")
	}
	if allowedMediaURL("https://example.test/video.mp4") {
		t.Fatal("expected unknown media host to be rejected")
	}
	if !allowedMediaURL("https://cdn.odcloud.net/anime/example.mp4") {
		t.Fatal("expected known direct media host to be accepted")
	}
}

func TestClassifyDirectMediaSupportsOnlyPlayerFileFormats(t *testing.T) {
	contentType, kind, err := classifyDirectMedia("https://cdn.odcloud.net/anime/example.mp4?token=short-lived")
	if err != nil || contentType != "video/mp4" || kind != "file" {
		t.Fatalf("unexpected MP4 classification: type=%q kind=%q err=%v", contentType, kind, err)
	}
	if _, _, err := classifyDirectMedia("https://cdn.odcloud.net/anime/example.m3u8"); !errors.Is(err, ErrStreamUnsupported) {
		t.Fatalf("expected HLS to remain unsupported, got %v", err)
	}
}

func TestResolveRejectsExternalHosts(t *testing.T) {
	if _, err := New().resolve("https://example.com/anime/test/"); err == nil {
		t.Fatal("expected external host to be rejected")
	}
}

func TestValidateRequestAcceptsSafeUnicodeSlug(t *testing.T) {
	tests := []struct {
		name  string
		slug  string
		valid bool
	}{
		{name: "ascii", slug: "example-anime", valid: true},
		{name: "unicode symbol", slug: "bang-dream-yume∞mita-sub-indo", valid: true},
		{name: "unicode letters", slug: "mahou-shoujo-éclair", valid: true},
		{name: "encoded once", slug: "bang-dream-yume%E2%88%9Emita-sub-indo", valid: false},
		{name: "encoded twice", slug: "bang-dream-yume%25E2%2588%259Emita-sub-indo", valid: false},
		{name: "slash", slug: "anime/example", valid: false},
		{name: "backslash", slug: `anime\example`, valid: false},
		{name: "dot segment", slug: "..", valid: false},
		{name: "query", slug: "example?preview=true", valid: false},
		{name: "control character", slug: "example\nanime", valid: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := ValidateRequest(Request{Kind: KindAnime, Slug: test.slug, Page: 1})
			if test.valid && err != nil {
				t.Fatalf("expected slug %q to be valid, got %v", test.slug, err)
			}
			if !test.valid && !errors.Is(err, ErrInvalidRequest) {
				t.Fatalf("expected slug %q to be rejected, got %v", test.slug, err)
			}
		})
	}
}

func TestRunEncodesUnicodeSlugOnceForSourceRequest(t *testing.T) {
	var requestedPath string
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requestedPath = request.URL.EscapedPath()
		response.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = response.Write([]byte(`
			<div class="infozingle"><p><span><b>Judul</b>: BanG Dream! Yume∞Mita</span></p></div>
			<div class="sinopc"><p>Synopsis.</p></div>`))
	}))
	defer server.Close()

	source, err := NewWithConfig(server.URL, server.Client(), 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = source.Run(context.Background(), Request{Kind: KindAnime, Slug: "bang-dream-yume∞mita-sub-indo", Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if requestedPath != "/anime/bang-dream-yume%E2%88%9Emita-sub-indo/" {
		t.Fatalf("expected Unicode slug to be encoded once, got %q", requestedPath)
	}
}

func TestRunRejectsPageWithoutExpectedContent(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
		response.Header().Set("Content-Type", "text/html")
		_, _ = response.Write([]byte("<html><body>layout changed</body></html>"))
	}))
	defer server.Close()

	source, err := NewWithConfig(server.URL, server.Client(), 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = source.Run(context.Background(), Request{Kind: KindHome, Page: 1})
	if !errors.Is(err, ErrInvalidContent) {
		t.Fatalf("expected invalid content error, got %v", err)
	}
}

func TestRunParsesCompleteCollection(t *testing.T) {
	var requestedPath string
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		requestedPath = request.URL.Path
		response.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = response.Write([]byte(`
			<div class="detpost">
				<div class="thumb"><a href="/anime/example-complete/"><img src="cover.jpg"></a></div>
				<div class="jdlflm">Example Complete</div>
				<div class="epz">12 Episode</div><div class="epztipe">8.20</div><div class="newnime">14 Okt</div>
			</div>
			<a class="page-numbers" href="/complete-anime/page/3/">3</a>
			<a class="page-numbers next" href="/complete-anime/page/2/">Next</a>`))
	}))
	defer server.Close()

	source, err := NewWithConfig(server.URL, server.Client(), 0)
	if err != nil {
		t.Fatal(err)
	}
	response, err := source.Run(context.Background(), Request{Kind: KindComplete, Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if requestedPath != "/complete-anime/" {
		t.Fatalf("expected complete collection path, got %q", requestedPath)
	}
	collection, ok := response.Data.(AnimeCollection)
	if !ok || len(collection.Items) != 1 {
		t.Fatalf("unexpected complete collection: %#v", response.Data)
	}
	item := collection.Items[0]
	if item.Slug != "example-complete" || item.Status != "complete" || item.Score != "8.20" {
		t.Fatalf("unexpected complete item: %#v", item)
	}
	if collection.Pagination.Current != 1 || collection.Pagination.Last != 3 || collection.Pagination.Next == "" {
		t.Fatalf("unexpected pagination: %#v", collection.Pagination)
	}
}

func TestRunMapsCompleteCollectionTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
		time.Sleep(50 * time.Millisecond)
		response.Header().Set("Content-Type", "text/html")
		_, _ = response.Write([]byte(`<div class="detpost"></div>`))
	}))
	defer server.Close()

	client := server.Client()
	client.Timeout = 5 * time.Millisecond
	source, err := NewWithConfig(server.URL, client, 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = source.Run(context.Background(), Request{Kind: KindComplete, Page: 1})
	if !errors.Is(err, ErrUpstream) || !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("expected upstream timeout, got %v", err)
	}
}

func TestRunMapsSourceNotFound(t *testing.T) {
	server := httptest.NewServer(http.NotFoundHandler())
	defer server.Close()

	source, err := NewWithConfig(server.URL, server.Client(), 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = source.Run(context.Background(), Request{Kind: KindAnime, Slug: "missing", Page: 1})
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected not found error, got %v", err)
	}
}

func TestRunRejectsRedirectOutsideSourceDomain(t *testing.T) {
	externalCalls := 0
	external := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
		externalCalls++
		response.Header().Set("Content-Type", "text/html")
		_, _ = response.Write([]byte("<html></html>"))
	}))
	defer external.Close()

	sourceServer := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		http.Redirect(response, request, external.URL, http.StatusFound)
	}))
	defer sourceServer.Close()

	source, err := NewWithConfig(sourceServer.URL, sourceServer.Client(), 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = source.Run(context.Background(), Request{Kind: KindHome, Page: 1})
	if !errors.Is(err, ErrUpstream) {
		t.Fatalf("expected upstream error, got %v", err)
	}
	if externalCalls != 0 {
		t.Fatalf("expected external redirect not to be followed, got %d calls", externalCalls)
	}
}
