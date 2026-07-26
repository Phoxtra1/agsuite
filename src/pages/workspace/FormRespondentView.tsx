import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  Star,
  Sliders,
  FileUp,
  MapPin,
  PenTool,
  Award,
  Download,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import {
  getFormByCode,
  submitFormResponse,
  type FormDocument,
  type Question
} from "@/lib/workspace/forms/documents";
import { toast } from "@/hooks/use-toast";

export default function FormRespondentView() {
  const { formCode } = useParams<{ formCode: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<any>(null);

  // Respondent answers mapped by questionId
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Signature Drawing States
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Pagination for Page Breaks
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Countdown Quiz Timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    async function loadForm() {
      if (!formCode) return;
      const doc = await getFormByCode(formCode);
      if (doc) {
        setForm(doc);

        // Auto-load saved draft progress
        const savedDraft = localStorage.getItem(`form_draft_${doc.id}`);
        if (savedDraft) {
          try {
            setAnswers(JSON.parse(savedDraft));
            toast({ title: "Draft progress loaded", description: "Resumed your previously typed entries." });
          } catch (e) {
            // ignore
          }
        }

        // Initialize quiz countdown timer
        if (doc.quizSettings?.enabled && doc.quizSettings.timer) {
          setSecondsLeft(doc.quizSettings.timer * 60);
        }
      } else {
        toast({ title: "Form not found", variant: "destructive" });
        navigate("/");
      }
      setLoading(false);
    }
    loadForm();
  }, [formCode, navigate]);

  // Handle countdown logic
  useEffect(() => {
    if (secondsLeft !== null && secondsLeft > 0 && !submitted) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev !== null && prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleSubmit(true); // Auto-submit when timer expires
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [secondsLeft, submitted]);

  // Save draft progress locally
  function handleAnswerChange(qId: string, val: any) {
    const updatedAnswers = { ...answers, [qId]: val };
    setAnswers(updatedAnswers);
    if (form?.settings?.autoSaveProgress) {
      localStorage.setItem(`form_draft_${form.id}`, JSON.stringify(updatedAnswers));
    }
  }

  // Multi-page parsing
  // We segment questions by page_break types
  const pages: Question[][] = [[]];
  if (form) {
    form.questions.forEach((q) => {
      if (q.type === "page_break") {
        pages.push([]);
      } else {
        pages[pages.length - 1].push(q);
      }
    });
  }

  const currentQuestions = pages[currentPageIndex] || [];
  const hasNextPage = currentPageIndex < pages.length - 1;
  const hasPrevPage = currentPageIndex > 0;

  // Signature canvas handlers
  function initSignatureCanvas(qId: string, canvas: HTMLCanvasElement | null) {
    if (!canvas) return;
    canvasRefs.current[qId] = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = form?.theme?.primary || "#1E2761";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    let drawing = false;

    function getCoordinates(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    canvas.onmousedown = (e) => {
      drawing = true;
      const { x, y } = getCoordinates(e);
      ctx!.beginPath();
      ctx!.moveTo(x, y);
    };

    canvas.onmousemove = (e) => {
      if (!drawing) return;
      const { x, y } = getCoordinates(e);
      ctx!.lineTo(x, y);
      ctx!.stroke();
    };

    canvas.onmouseup = () => {
      drawing = false;
      handleAnswerChange(qId, canvas!.toDataURL());
    };

    // Touch support for mobiles
    canvas.ontouchstart = (e) => {
      e.preventDefault();
      drawing = true;
      const { x, y } = getCoordinates(e);
      ctx!.beginPath();
      ctx!.moveTo(x, y);
    };
    canvas.ontouchmove = (e) => {
      e.preventDefault();
      if (!drawing) return;
      const { x, y } = getCoordinates(e);
      ctx!.lineTo(x, y);
      ctx!.stroke();
    };
    canvas.ontouchend = () => {
      drawing = false;
      handleAnswerChange(qId, canvas!.toDataURL());
    };
  }

  function clearSignature(qId: string) {
    const canvas = canvasRefs.current[qId];
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleAnswerChange(qId, null);
  }

  // Handle Response Submission
  async function handleSubmit(forcedByTimer = false) {
    if (!form) return;

    if (forcedByTimer) {
      toast({ title: "Timer expired", description: "Your response is being submitted automatically.", variant: "warning" });
    } else {
      // Validate mandatory fields on current page
      const missingRequired = currentQuestions.some(
        (q) => q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
      );
      if (missingRequired) {
        toast({ title: "Missing Required Fields", description: "Please complete all fields marked with an asterisk (*).", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    const resp = await submitFormResponse(form.id, "anonymous-respondent", answers);
    if (resp) {
      setSubmittedResponse(resp);
      setSubmitted(true);
      // Remove draft save
      localStorage.removeItem(`form_draft_${form.id}`);
      toast({ title: "Submitted successfully!", description: "Response catalogued securely on Amineva Cloud." });
    } else {
      toast({ title: "Error", description: "Submission failed. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  }

  // Download PDF certificate simulation
  function triggerCertificateDownload() {
    toast({ title: "Certificate Download triggered", description: "Compiling vector diploma..." });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600" />
      </div>
    );
  }

  if (submitted && form) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 px-4 flex items-center justify-center font-sans">
        <div className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-xl p-8 space-y-6 text-center animate-fade-in">
          <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Submission catalogued!</h2>
            <p className="text-sm text-muted-foreground">
              {form.settings.confirmationMessage || "Thank you! Your response has been securely submitted."}
            </p>
          </div>

          {/* Quiz Results Card */}
          {form.quizSettings?.enabled && submittedResponse?.score && (
            <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-purple-600">Quiz Assessment Outcomes</span>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-card border border-border rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Earned Points</span>
                  <div className="text-xl font-bold text-foreground">
                    {submittedResponse.score.earnedPoints} / {submittedResponse.score.totalPoints}
                  </div>
                </div>
                <div className="p-3 bg-card border border-border rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assessment Grade</span>
                  <div className={`text-xl font-bold ${submittedResponse.score.passed ? 'text-emerald-600' : 'text-destructive'}`}>
                    {submittedResponse.score.percentage}% ({submittedResponse.score.passed ? 'PASSED' : 'FAILED'})
                  </div>
                </div>
              </div>

              {/* Certificate Download Panel */}
              {form.quizSettings.certificates && submittedResponse.score.passed && (
                <div className="pt-3 border-t border-purple-500/10 flex flex-col items-center gap-2.5">
                  <Award className="h-10 w-10 text-amber-500 animate-pulse" />
                  <div className="text-xs text-muted-foreground">Congratulations on passing! Your certificate of competency is ready.</div>
                  <button
                    onClick={triggerCertificateDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Certificate (PDF)
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Amineva Global Suite</span>
            <span>Secured with SSL AES encryption</span>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = form ? Math.round(((currentPageIndex + 1) / pages.length) * 100) : 0;

  return (
    <div
      className="min-h-screen py-12 px-4 flex flex-col items-center justify-between font-sans transition-all duration-200"
      style={{ backgroundColor: form?.theme?.background || "#F5F7FA" }}
    >
      {form && (
        <div className="w-full max-w-2xl space-y-6 flex-1 flex flex-col justify-center">
          {/* Header Panel */}
          <div
            className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden relative transition-all duration-300"
            style={{ borderTop: `10px solid ${form.theme.primary}` }}
          >
            {form.theme.headerImageUrl && (
              <div className="h-36 w-full overflow-hidden">
                <img src={form.theme.headerImageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 md:p-8 space-y-3">
              {form.theme.logoUrl && (
                <img src={form.theme.logoUrl} alt="Logo" className="h-12 w-auto rounded object-contain mb-3" />
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{form.title}</h1>
              {form.description && (
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">{form.description}</p>
              )}

              {/* Progress and Timer Indicators */}
              <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Page {currentPageIndex + 1} of {pages.length}</span>
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-fuchsia-600 transition-all duration-200" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>

                {secondsLeft !== null && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Time Remaining: {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Page Questions Form */}
          <div className="space-y-4">
            {currentQuestions.map((q) => (
              <div key={q.id} className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground flex items-start gap-1">
                    {q.title}
                    {q.required && <span className="text-destructive font-bold">*</span>}
                  </h3>
                  {q.description && <p className="text-xs text-muted-foreground leading-normal font-sans">{q.description}</p>}
                </div>

                {/* Question Type Inputs */}
                <div className="pt-2">
                  {["short_answer", "email", "phone", "url", "number", "currency"].includes(q.type) && (
                    <input
                      type={q.type === "number" ? "number" : "text"}
                      placeholder={q.type === "currency" ? "GHS 0.00" : "Type your answer..."}
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full p-3 border border-border bg-background text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25 transition-all"
                    />
                  )}

                  {q.type === "long_answer" && (
                    <textarea
                      rows={4}
                      placeholder="Type multi-line paragraph answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full p-3 border border-border bg-background text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25 transition-all resize-none font-sans"
                    />
                  )}

                  {q.type === "date" && (
                    <input
                      type="date"
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="p-3 border border-border bg-background text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25"
                    />
                  )}

                  {q.type === "time" && (
                    <input
                      type="time"
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="p-3 border border-border bg-background text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25"
                    />
                  )}

                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {q.options?.map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center gap-2.5 p-3 rounded-xl border border-border/40 hover:bg-muted/30 cursor-pointer transition select-none">
                          <input
                            type="radio"
                            name={`radio-${q.id}`}
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswerChange(q.id, opt)}
                            className="text-fuchsia-600 focus:ring-fuchsia-500 border-border"
                          />
                          <span className="text-xs text-foreground font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "checkboxes" && (
                    <div className="space-y-2">
                      {q.options?.map((opt, oIdx) => {
                        const checkedArr = answers[q.id] || [];
                        const isChecked = checkedArr.includes(opt);

                        return (
                          <label key={oIdx} className="flex items-center gap-2.5 p-3 rounded-xl border border-border/40 hover:bg-muted/30 cursor-pointer transition select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let nextArr = [...checkedArr];
                                if (e.target.checked) {
                                  nextArr.push(opt);
                                } else {
                                  nextArr = nextArr.filter((val) => val !== opt);
                                }
                                handleAnswerChange(q.id, nextArr);
                              }}
                              className="rounded border-border text-fuchsia-600 focus:ring-fuchsia-500 h-4 w-4"
                            />
                            <span className="text-xs text-foreground font-medium">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "dropdown" && (
                    <select
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full max-w-xs p-3 border border-border bg-background text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25 text-foreground"
                    >
                      <option value="">Select option...</option>
                      {q.options?.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {q.type === "yes_no" && (
                    <div className="flex gap-3">
                      {["Yes", "No"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswerChange(q.id, opt)}
                          className={`flex-1 py-3 border rounded-xl font-semibold text-xs transition ${
                            answers[q.id] === opt
                              ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-sm"
                              : "border-border hover:bg-muted/30 text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {["rating_star", "rating_emoji"].map((type) => {
                    if (q.type !== type) return null;
                    return (
                      <div key={type} className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((it) => {
                          const active = answers[q.id] >= it;
                          return (
                            <button
                              key={it}
                              onClick={() => handleAnswerChange(q.id, it)}
                              className="focus:outline-none transform hover:scale-115 transition duration-150"
                            >
                              <Star className={`h-8 w-8 ${active ? 'text-amber-400 fill-amber-400' : 'text-border fill-none'}`} />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}

                  {q.type === "linear_scale" && (
                    <div className="flex items-center justify-between max-w-sm pt-2">
                      <span className="text-xs text-muted-foreground">Disagree</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((it) => {
                          const active = answers[q.id] === it;
                          return (
                            <button
                              key={it}
                              onClick={() => handleAnswerChange(q.id, it)}
                              className={`h-9 w-9 rounded-full border flex items-center justify-center text-xs font-bold transition ${
                                active
                                  ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-sm"
                                  : "border-border hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              {it}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs text-muted-foreground font-sans">Agree</span>
                    </div>
                  )}

                  {q.type === "slider" && (
                    <div className="space-y-1.5 max-w-xs pt-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={answers[q.id] || 50}
                        onChange={(e) => handleAnswerChange(q.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none"
                      />
                      <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>Min (0)</span>
                        <span className="text-fuchsia-600 font-bold">{answers[q.id] || 50}</span>
                        <span>Max (100)</span>
                      </div>
                    </div>
                  )}

                  {q.type === "signature" && (
                    <div className="space-y-3">
                      <div className="border border-border rounded-2xl overflow-hidden bg-background">
                        <canvas
                          width={480}
                          height={160}
                          ref={(el) => initSignatureCanvas(q.id, el)}
                          className="w-full block bg-background cursor-crosshair h-[160px]"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-sans">
                          <PenTool className="h-3.5 w-3.5" /> Secure Digital Signature Canvas
                        </span>
                        <button
                          onClick={() => clearSignature(q.id)}
                          className="text-[10px] font-bold text-destructive hover:underline"
                        >
                          Clear Signature
                        </button>
                      </div>
                    </div>
                  )}

                  {["file_upload", "image_upload", "video_upload"].includes(q.type) && (
                    <div className="space-y-2">
                      <label className="w-full max-w-xs p-5 rounded-2xl border-2 border-dashed border-border bg-background hover:bg-muted/10 cursor-pointer flex flex-col items-center text-center transition">
                        <FileUp className="h-6 w-6 text-muted-foreground/60 mb-1" />
                        <span className="text-xs font-semibold text-foreground">Attach document...</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleAnswerChange(q.id, file.name);
                              toast({ title: "File attached", description: file.name });
                            }
                          }}
                        />
                      </label>
                      {answers[q.id] && (
                        <div className="text-xs font-mono font-medium text-emerald-600 flex items-center gap-1 bg-emerald-500/5 p-2 rounded border border-emerald-500/10 max-w-xs">
                          <Check className="h-3.5 w-3.5" /> Attached: {answers[q.id]}
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === "address" && (
                    <div className="space-y-2 max-w-md text-xs text-foreground">
                      <input
                        placeholder="Street Address"
                        value={answers[q.id]?.street || ""}
                        onChange={(e) => handleAnswerChange(q.id, { ...answers[q.id], street: e.target.value })}
                        className="w-full p-2.5 border border-border bg-background rounded-xl"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="City"
                          value={answers[q.id]?.city || ""}
                          onChange={(e) => handleAnswerChange(q.id, { ...answers[q.id], city: e.target.value })}
                          className="w-full p-2.5 border border-border bg-background rounded-xl"
                        />
                        <input
                          placeholder="Zip / Postal"
                          value={answers[q.id]?.zip || ""}
                          onChange={(e) => handleAnswerChange(q.id, { ...answers[q.id], zip: e.target.value })}
                          className="w-full p-2.5 border border-border bg-background rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {["matrix_mc", "matrix_cb"].includes(q.type) && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-xs text-muted-foreground">
                        <thead>
                          <tr>
                            <th className="p-2 text-left border-b border-border">Rows</th>
                            {q.gridColumns?.map((col, idx) => (
                              <th key={idx} className="p-2 text-center border-b border-border font-semibold text-foreground">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {q.options?.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="p-2 text-left border-b border-border/40 font-semibold text-foreground">{row}</td>
                              {q.gridColumns?.map((col, cIdx) => {
                                const rowAnswers = answers[q.id] || {};
                                const isSelected = q.type === "matrix_cb"
                                  ? (rowAnswers[row] || []).includes(col)
                                  : rowAnswers[row] === col;

                                return (
                                  <td key={cIdx} className="p-2 text-center border-b border-border/40">
                                    <input
                                      type={q.type === "matrix_cb" ? "checkbox" : "radio"}
                                      checked={isSelected}
                                      onChange={() => {
                                        if (q.type === "matrix_cb") {
                                          let cellArr = [...(rowAnswers[row] || [])];
                                          if (cellArr.includes(col)) {
                                            cellArr = cellArr.filter((val) => val !== col);
                                          } else {
                                            cellArr.push(col);
                                          }
                                          handleAnswerChange(q.id, { ...rowAnswers, [row]: cellArr });
                                        } else {
                                          handleAnswerChange(q.id, { ...rowAnswers, [row]: col });
                                        }
                                      }}
                                      className="text-fuchsia-600 focus:ring-fuchsia-500 rounded border-border"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {q.type === "ranking" && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Drag or select index priorities</p>
                      {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center justify-between p-2.5 border border-border rounded-xl bg-background text-xs">
                          <span>{opt}</span>
                          <select
                            value={(answers[q.id] || {})[opt] || ""}
                            onChange={(e) => {
                              const currRank = answers[q.id] || {};
                              handleAnswerChange(q.id, { ...currRank, [opt]: Number(e.target.value) });
                            }}
                            className="p-1 border border-border rounded bg-muted/20 text-xs"
                          >
                            <option value="">Priority index</option>
                            {q.options?.map((_, idx) => (
                              <option key={idx} value={idx + 1}>Priority #{idx + 1}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "consent" && (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/10 select-none">
                      <input
                        type="checkbox"
                        checked={answers[q.id] === true}
                        onChange={(e) => handleAnswerChange(q.id, e.target.checked)}
                        className="rounded border-border text-fuchsia-600 focus:ring-fuchsia-500 h-4 w-4 mt-0.5"
                      />
                      <div className="text-xs font-sans text-muted-foreground leading-tight">
                        By checking this box, I declare that I consent to Amineva’s processing of my data in accordance with local regulations and the platform privacy policy.
                      </div>
                    </label>
                  )}

                  {q.type === "rich_text" && (
                    <div className="p-3 bg-muted/15 border border-border/40 rounded-2xl text-center text-xs italic text-muted-foreground">
                      {q.description || "Visual instructions context block."}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Control Buttons */}
          <div className="pt-8 flex items-center justify-between">
            <button
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={!hasPrevPage}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl font-semibold text-xs hover:bg-muted/40 text-foreground transition disabled:opacity-30 select-none"
            >
              <ChevronLeft className="h-4 w-4" /> Previous page
            </button>

            {hasNextPage ? (
              <button
                onClick={() => {
                  // Validate required fields on current page first
                  const missingRequired = currentQuestions.some(
                    (q) => q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
                  );
                  if (missingRequired) {
                    toast({ title: "Required Fields Left", description: "Please answer all required questions before proceeding.", variant: "destructive" });
                    return;
                  }
                  setCurrentPageIndex((prev) => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs rounded-xl shadow-sm transition select-none"
              >
                Next page <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs rounded-xl shadow transition select-none animate-pulse"
              >
                <Check className="h-4 w-4" /> Submit Questionnaire
              </button>
            )}
          </div>
        </div>
      )}

      {/* Powered by Amineva footer badge */}
      <footer className="pt-12 text-center text-[10px] text-muted-foreground font-sans">
        Powered by <span className="font-semibold text-foreground">Amineva Global Suite</span> · Secure enterprise data collection
      </footer>
    </div>
  );
}
