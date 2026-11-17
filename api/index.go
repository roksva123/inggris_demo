package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

type program struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Level       string `json:"level"`
	Price       string `json:"price"`
	Duration    string `json:"duration"`
	Description string `json:"description"`
	Accent      string `json:"accent"`
}

type testimonial struct {
	Quote  string `json:"quote"`
	Name   string `json:"name"`
	Role   string `json:"role"`
	Result string `json:"result"`
}

type tutor struct {
	Name     string `json:"name"`
	Subject  string `json:"subject"`
	Bio      string `json:"bio"`
	Initials string `json:"initials"`
	Color    string `json:"color"`
}

type stat struct {
	Value  int    `json:"value"`
	Suffix string `json:"suffix"`
	Label  string `json:"label"`
}

type trialRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Grade   string `json:"grade"`
	Program string `json:"program"`
}

var programs = []program{
	{ID: "sd", Name: "Teman SD", Level: "Kelas 1–6", Price: "Rp 320k", Duration: "8 sesi / bulan", Description: "Belajar dasar dengan cara yang seru, sabar, dan terasa dekat.", Accent: "mustard"},
	{ID: "smp", Name: "Laju SMP", Level: "Kelas 7–9", Price: "Rp 420k", Duration: "8 sesi / bulan", Description: "Pondasi kuat untuk matematika, sains, dan percaya diri di sekolah.", Accent: "tomato"},
	{ID: "sma", Name: "Ngebut SMA", Level: "Kelas 10–12", Price: "Rp 520k", Duration: "8 sesi / bulan", Description: "Strategi belajar yang lebih tajam untuk target nilai dan jurusan.", Accent: "sage"},
	{ID: "utbk", Name: "Sprint UTBK", Level: "Kelas 12 & gap year", Price: "Rp 680k", Duration: "12 sesi / bulan", Description: "Latihan terarah, bedah soal, dan simulasi yang bikin siap tempur.", Accent: "mustard"},
	{ID: "english", Name: "English Club", Level: "Semua usia", Price: "Rp 390k", Duration: "8 sesi / bulan", Description: "Ngobrol lebih pede dengan kelas kecil dan praktik yang hidup.", Accent: "tomato"},
}

var testimonials = []testimonial{
	{Quote: "Dulu harus disuruh. Sekarang malah minta tambah sesi.", Name: "Nadia Pratama", Role: "Orang tua siswa SD", Result: "Nilai Matematika 72 → 94"},
	{Quote: "Tutor-nya ngerti cara jelasin sampai aku benar-benar paham.", Name: "Raka Wijaya", Role: "Siswa SMP", Result: "Peringkat 18 → 5"},
	{Quote: "Simulasi UTBK-nya bikin aku tahu harus fokus di mana.", Name: "Alya Safitri", Role: "Siswa kelas 12", Result: "Target skor tercapai"},
	{Quote: "Bukan cuma les. Anak saya jadi punya rutinitas belajar.", Name: "Dimas & Sari", Role: "Orang tua siswa SMA", Result: "Konsisten 8 bulan"},
	{Quote: "Kelas English Club bikin saya berani presentasi tanpa teks.", Name: "Kevin Hartono", Role: "Siswa SMP", Result: "Speaking makin pede"},
	{Quote: "Update perkembangan anaknya jelas dan enak diajak diskusi.", Name: "Maya Lestari", Role: "Orang tua siswa SD", Result: "Komunikasi selalu nyambung"},
}

var tutors = []tutor{
	{Name: "Kak Naya", Subject: "Matematika", Bio: "Suka mengubah soal rumit jadi langkah kecil yang masuk akal.", Initials: "NY", Color: "tomato"},
	{Name: "Kak Bima", Subject: "Fisika", Bio: "Membawa eksperimen kecil dan rasa penasaran ke setiap sesi.", Initials: "BM", Color: "mustard"},
	{Name: "Kak Citra", Subject: "English", Bio: "Percakapan sehari-hari dulu, grammar menyusul dengan natural.", Initials: "CR", Color: "sage"},
	{Name: "Kak Reza", Subject: "UTBK", Bio: "Coach strategi yang tahu kapan harus gas dan kapan harus jeda.", Initials: "RZ", Color: "forest"},
}

var stats = []stat{
	{Value: 1200, Suffix: "+", Label: "siswa aktif"},
	{Value: 95, Suffix: "%", Label: "nilai naik"},
	{Value: 40, Suffix: "+", Label: "tutor pilihan"},
	{Value: 8, Suffix: " th", Label: "menemani belajar"},
}

// Handler serves all API routes through one Vercel serverless function.
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	route := strings.Trim(r.URL.Query().Get("route"), "/")
	if route == "" {
		route = strings.TrimPrefix(strings.Trim(r.URL.Path, "/"), "api/")
	}

	switch route {
	case "programs":
		getJSON(w, r, programs)
	case "testimonials":
		getJSON(w, r, testimonials)
	case "tutors":
		getJSON(w, r, tutors)
	case "stats":
		getJSON(w, r, stats)
	case "trial":
		postTrial(w, r)
	case "healthz":
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("ok"))
	default:
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	}
}

func getJSON(w http.ResponseWriter, r *http.Request, value any) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	writeJSON(w, http.StatusOK, value)
}

func postTrial(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	var req trialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "format data tidak valid"})
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Phone = strings.TrimSpace(req.Phone)
	req.Grade = strings.TrimSpace(req.Grade)
	req.Program = strings.TrimSpace(req.Program)
	if len(req.Name) < 2 || len(req.Phone) < 8 || req.Grade == "" || req.Program == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "lengkapi data trial class terlebih dahulu"})
		return
	}

	log.Printf("TRIAL_REQUEST name=%q phone=%q grade=%q program=%q", req.Name, req.Phone, req.Grade, req.Program)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
