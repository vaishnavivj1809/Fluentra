import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const API = "http://localhost:5000";

export default function App() {
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");
  const [target, setTarget] = useState("mr");
  const [source, setSource] = useState("auto"); // ✅ NEW
  const [history, setHistory] = useState([]);
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(false);

  /* LOAD HISTORY */
  const loadHistory = async () => {
    const res = await axios.get(`${API}/history`);
    setHistory(res.data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  /* TRANSLATE */
  const translate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API}/translate`, {
        text,
        source,   // ✅ send source
        target,
      });

      setTranslated(res.data.translatedText);
      loadHistory();
    } catch {
      setTranslated("❌ Error");
    }
    setLoading(false);
  };

  /* DELETE ONE */
  const deleteOne = async (id) => {
    await axios.delete(`${API}/history/${id}`);
    setHistory((prev) => prev.filter((h) => h._id !== id));
  };

  /* CLEAR ALL */
  const deleteAll = async () => {
    await axios.delete(`${API}/history`);
    setHistory([]);
  };

  /* VOICE */
  const voice = () => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) return alert("Use Chrome/Edge");

    const rec = new SR();

    const langMap = {
      en: "en-US",
      hi: "hi-IN",
      mr: "mr-IN",
      fr: "fr-FR",
      de: "de-DE",
    };

    rec.lang = langMap[source] || "en-US";

    rec.start();

    rec.onresult = (e) => {
      setText(e.results[0][0].transcript);
    };

    rec.onerror = () => {
      alert("Voice error");
    };
  };

  /* SPEAK */
  const speak = () => {
    if (!translated) return;

    const utter = new SpeechSynthesisUtterance(translated);

    const langMap = {
      en: "en-US",
      hi: "hi-IN",
      mr: "mr-IN",
      fr: "fr-FR",
      de: "de-DE",
    };

    utter.lang = langMap[target] || "en-US";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  /* PDF */
  const exportPDF = () => {
    try {
      const pdf = new jsPDF();
      let y = 20;

      pdf.setFontSize(18);
      pdf.text("Fluentra Translator", 10, y);

      y += 8;

      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, y);

      y += 10;

      pdf.line(10, y, 200, y);
      y += 10;

      if (text && translated) {
        pdf.text("Current Translation:", 10, y);
        y += 6;

        pdf.text(`Input: ${text}`, 10, y);
        y += 6;

        pdf.setTextColor(40, 40, 200);
        pdf.text(`Output: ${translated}`, 10, y);

        pdf.setTextColor(0, 0, 0);
        y += 10;
      }

      pdf.text("History:", 10, y);
      y += 8;

      history.forEach((h, i) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(`${i + 1}. ${h.sourceText}`, 10, y);
        y += 5;

        pdf.setTextColor(40, 40, 200);
        pdf.text(`${h.translatedText}`, 10, y);

        pdf.setTextColor(0, 0, 0);
        y += 8;
      });

      pdf.save("Fluentra.pdf");
    } catch {
      alert("PDF failed");
    }
  };

  return (
    <div
      className={`min-h-screen transition ${
        dark
          ? "bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-black text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <h1 className="text-3xl font-bold">Fluentra</h1>
        {/* toggle*/}
        <button
          onClick={() => setDark(!dark)}
          className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:scale-110 transition"
        >
          🌙
        </button>
      </div>

      {/* MAIN */}
      <div
        className={`max-w-4xl mx-auto p-6 rounded-3xl backdrop-blur-xl shadow-xl ${
          dark ? "bg-white/10" : "bg-white shadow-md"
        }`}
      >
        <div className="grid md:grid-cols-2 gap-4">

          <textarea
            className={`p-4 rounded-xl ${
              dark
                ? "bg-black/30 text-white"
                : "bg-white border border-gray-300 text-black"
            }`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text..."
          />

          <div
            className={`p-4 rounded-xl ${
              dark
                ? "bg-black/30 text-white"
                : "bg-white border border-gray-300 text-black"
            }`}
          >
            {loading ? "Translating..." : translated || "Translation"}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-wrap gap-3 mt-5">

          {/* ✅ SOURCE SELECT */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white text-black border"
          >
           
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>

          {/* TARGET */}
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white text-black border"
          >
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>

          <button onClick={translate} className="btn gradient">
            Translate
          </button>

          <button onClick={() => setText("")} className="btn red">
            Clear
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(translated)}
            className="btn green"
          >
            Copy
          </button>

          <button onClick={speak} className="btn purple">
            Speak
          </button>

          <button onClick={voice} className="btn yellow">
            🎤 Voice
          </button>
        </div>
      </div>

      {/* HISTORY */}
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="flex justify-between mb-3">
          <h2 className="font-semibold">History</h2>

          <div className="flex gap-3">
            <button onClick={deleteAll} className="btn red">
              Clear All
            </button>

            <button onClick={exportPDF} className="btn gradient">
              Export PDF
            </button>
          </div>
        </div>

        {history.map((h) => (
          <div
            key={h._id}
            className="p-4 mb-3 rounded-xl bg-white/10 flex justify-between items-center hover:scale-[1.02] transition"
          >
            <div>
              <p className="text-xs opacity-60">{h.sourceText}</p>
              <p>{h.translatedText}</p>
            </div>

            <button
              onClick={() => deleteOne(h._id)}
              className="text-red-400 text-xl hover:scale-125 transition"
            >
              ✖
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .btn {
          padding: 10px 18px;
          border-radius: 12px;
          color: white;
          font-weight: 500;
          transition: 0.3s;
        }

        .btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 12px rgba(99,102,241,0.6);
        }

        .gradient {
          background: linear-gradient(to right, #6366f1, #a855f7);
        }

        .red { background: #ef4444; }
        .green { background: #22c55e; }
        .purple { background: #9333ea; }
        .yellow { background: #facc15; color: black; }
      `}</style>
    </div>
  );
}