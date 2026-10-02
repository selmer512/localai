package http_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v4"
	"github.com/mudler/LocalAI/core/application"
	"github.com/mudler/LocalAI/core/config"
	. "github.com/mudler/LocalAI/core/http"
	"github.com/mudler/LocalAI/pkg/system"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

// --ui-dir serves the web UI from a folder so a UI change ships by replacing
// that folder rather than rebuilding LocalAI. A folder without a build in it
// must not take the UI down: it falls back to the embedded copy.
var _ = Describe("Web UI served from a directory", func() {
	newApp := func(uiDir string) (*echo.Echo, func()) {
		tmpdir, err := os.MkdirTemp("", "ui-dir-")
		Expect(err).ToNot(HaveOccurred())
		modelDir := filepath.Join(tmpdir, "models")
		Expect(os.Mkdir(modelDir, 0750)).To(Succeed())
		bDir := filepath.Join(tmpdir, "backends")
		Expect(os.Mkdir(bDir, 0750)).To(Succeed())

		c, cancel := context.WithCancel(context.Background())
		systemState, err := system.GetSystemState(
			system.WithBackendPath(bDir),
			system.WithModelPath(modelDir),
		)
		Expect(err).ToNot(HaveOccurred())
		appInst, err := application.New(
			config.WithContext(c),
			config.WithSystemState(systemState),
			config.WithUIDir(uiDir),
		)
		Expect(err).ToNot(HaveOccurred())
		app, err := API(appInst)
		Expect(err).ToNot(HaveOccurred())
		return app, func() { cancel(); Expect(os.RemoveAll(tmpdir)).To(Succeed()) }
	}

	get := func(app *echo.Echo, path string) (int, string) {
		rec := httptest.NewRecorder()
		app.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
		body, _ := io.ReadAll(rec.Body)
		return rec.Code, string(body)
	}

	It("serves index.html and assets from the folder, and picks up edits without a restart", func() {
		uiDir := GinkgoT().TempDir()
		Expect(os.MkdirAll(filepath.Join(uiDir, "assets"), 0750)).To(Succeed())
		Expect(os.WriteFile(filepath.Join(uiDir, "index.html"), []byte("<html><head></head><body>from-disk-v1</body></html>"), 0600)).To(Succeed())
		Expect(os.WriteFile(filepath.Join(uiDir, "assets", "app-abc.js"), []byte("console.log('from-disk')"), 0600)).To(Succeed())

		app, done := newApp(uiDir)
		defer done()

		code, body := get(app, "/app")
		Expect(code).To(Equal(http.StatusOK))
		Expect(body).To(ContainSubstring("from-disk-v1"))

		code, body = get(app, "/assets/app-abc.js")
		Expect(code).To(Equal(http.StatusOK))
		Expect(body).To(ContainSubstring("from-disk"))

		Expect(os.WriteFile(filepath.Join(uiDir, "index.html"), []byte("<html><head></head><body>from-disk-v2</body></html>"), 0600)).To(Succeed())
		_, body = get(app, "/app/chat")
		Expect(body).To(ContainSubstring("from-disk-v2"))
	})

	It("falls back to the embedded UI when the folder holds no build", func() {
		app, done := newApp(GinkgoT().TempDir())
		defer done()

		code, body := get(app, "/app")
		Expect(code).To(Equal(http.StatusOK))
		Expect(body).To(ContainSubstring(`<div id="root">`))
	})
})
