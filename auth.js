// Ibn Bāz Academy authentication starter.
// Create a Supabase project, then replace these two placeholders with its
// Project URL and anon/public key. NEVER put a service_role key in browser code.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tjcqsnuxnokyimjyveql.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_obh6XrD2TeNqsiI7wSK3WA_QlCVMp2l";
const configured = !SUPABASE_URL.startsWith("YOUR_") && !SUPABASE_ANON_KEY.startsWith("YOUR_");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const signupTab = document.getElementById("signupTab");
const loginTab = document.getElementById("loginTab");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("authMessage");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
function switchMode(mode) {
  const signup = mode === "signup";
  signupForm.hidden = !signup;
  loginForm.hidden = signup;
  signupTab.classList.toggle("active", signup);
  loginTab.classList.toggle("active", !signup);
  showMessage("");
}
signupTab.addEventListener("click", () => switchMode("signup"));
loginTab.addEventListener("click", () => switchMode("login"));

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!configured) return showMessage("The account system is not connected yet. The academy administrator must add the Supabase project settings first.", true);
  const data = new FormData(signupForm);
  const button = signupForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const { error } = await supabase.auth.signUp({
      email: data.get("email"),
      password: data.get("password"),
      options: { data: { full_name: data.get("fullName") } }
    });
    if (error) throw error;
    showMessage("Account request received. Check your email for a confirmation link if email confirmation is enabled.");
    signupForm.reset();
  } catch (error) {
    showMessage(error.message || "We could not create your account. Please try again.", true);
  } finally { button.disabled = false; }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!configured) return showMessage("The account system is not connected yet. The academy administrator must add the Supabase project settings first.", true);
  const data = new FormData(loginForm);
  const button = loginForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.get("email"), password: data.get("password")
    });
    if (error) throw error;
    window.location.href = "dashboard.html";
  } catch (error) {
    showMessage(error.message || "Login failed. Check your details and try again.", true);
  } finally { button.disabled = false; }
});

document.getElementById("resetPassword").addEventListener("click", async () => {
  if (!configured) return showMessage("The account system is not connected yet.", true);
  const email = loginForm.elements.email.value.trim();
  if (!email) return showMessage("Enter your email address first, then select Forgot password.", true);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname.replace("auth.html", "reset-password.html")
  });
  showMessage(error ? error.message : "If an account exists for this email, a password reset link has been sent.");
});
