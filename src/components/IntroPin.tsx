import { useState, type FormEvent, type ReactNode } from "react";

const INTRO_PIN = "664";

export default function IntroPin({ children }: { children: ReactNode }) {
  const [pin, setPin] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin === INTRO_PIN) {
      setUnlocked(true);
      return;
    }
    setInvalid(true);
  }

  if (unlocked) return <>{children}</>;

  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 py-10">
      <section className="w-full max-w-sm border border-ink/10 bg-white p-8">
        <h1 className="font-display text-4xl">Bustamante 175</h1>
        <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
          <label htmlFor="intro-pin" className="text-sm font-semibold">
            PIN de acceso
          </label>
          <input
            id="intro-pin"
            className="min-h-12 w-full border border-ink/30 px-3"
            type="password"
            inputMode="numeric"
            maxLength={3}
            autoComplete="off"
            value={pin}
            aria-invalid={invalid}
            aria-describedby={invalid ? "intro-pin-error" : undefined}
            onChange={(event) => {
              setPin(event.target.value);
              setInvalid(false);
            }}
            required
          />
          {invalid && (
            <p id="intro-pin-error" role="alert" className="text-sm text-red-700">
              PIN incorrecto. Inténtalo de nuevo.
            </p>
          )}
          <button className="mt-2 min-h-12 bg-morada px-4 font-semibold text-white" type="submit">
            Abrir documento
          </button>
        </form>
      </section>
    </main>
  );
}
