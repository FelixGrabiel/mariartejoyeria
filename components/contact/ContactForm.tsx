"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check } from "@/components/ui/icons";

interface FormState {
  name: string;
  contact: string;
  topic: string;
  message: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const initial: FormState = { name: "", contact: "", topic: "Consulta sobre un producto", message: "" };

function validate(values: FormState): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Escribe tu nombre (mínimo 2 caracteres).";
  const contact = values.contact.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const isPhone = /^(\+?51)?\s?9\d{2}\s?\d{3}\s?\d{3}$/.test(contact);
  if (!contact) errors.contact = "Indica un correo o celular para responderte.";
  else if (!isEmail && !isPhone) errors.contact = "Usa un correo válido o un celular peruano de 9 dígitos (ej. 987 654 321).";
  if (values.message.trim().length < 10) errors.message = "Cuéntanos un poco más (mínimo 10 caracteres).";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validate(values);
    setErrors(result);
    if (Object.keys(result).length === 0) {
      setSent(true);
    } else {
      const firstKey = Object.keys(result)[0];
      document.getElementById(`contact-${firstKey}`)?.focus();
    }
  }

  if (sent) {
    return (
      <div role="status" className="card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
          <Check size={24} />
        </span>
        <h3 className="mt-5 font-serif text-[1.8rem] font-semibold">¡Gracias, {values.name.trim().split(" ")[0]}!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Tu mensaje se validó correctamente, pero <strong className="text-ink">no se envió a MariArte</strong>: este formulario es de demostración. Para una respuesta real, escríbenos por WhatsApp.
        </p>
        <button
          type="button"
          className="btn btn-secondary mt-6"
          onClick={() => {
            setValues(initial);
            setSent(false);
          }}
        >
          Escribir otro mensaje
        </button>
      </div>
    );
  }

  const fieldError = (key: keyof FormState) =>
    errors[key] ? (
      <p id={`contact-${key}-error`} className="field-error">
        <AlertCircle size={14} /> {errors[key]}
      </p>
    ) : null;

  return (
    <form noValidate onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8" aria-describedby="contact-demo-note">
      <div>
        <label htmlFor="contact-name" className="field-label">Nombre</label>
        <input
          id="contact-name"
          className="field"
          autoComplete="name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
        {fieldError("name")}
      </div>
      <div>
        <label htmlFor="contact-contact" className="field-label">Correo o celular</label>
        <input
          id="contact-contact"
          className="field"
          inputMode="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com o 987 654 321"
          value={values.contact}
          onChange={(e) => update("contact", e.target.value)}
          aria-invalid={Boolean(errors.contact)}
          aria-describedby={errors.contact ? "contact-contact-error" : undefined}
        />
        {fieldError("contact")}
      </div>
      <div>
        <label htmlFor="contact-topic" className="field-label">Motivo</label>
        <select id="contact-topic" className="field" value={values.topic} onChange={(e) => update("topic", e.target.value)}>
          <option>Consulta sobre un producto</option>
          <option>Pedido personalizado</option>
          <option>Envíos</option>
          <option>Otro</option>
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="field-label">Mensaje</label>
        <textarea
          id="contact-message"
          rows={5}
          className="field resize-none"
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {fieldError("message")}
      </div>
      <button type="submit" className="btn btn-primary w-full">Enviar mensaje (demo)</button>
      <p id="contact-demo-note" className="text-center text-[12px] text-muted">
        Formulario de demostración: valida los datos y confirma en pantalla, pero no envía ni guarda información.
      </p>
    </form>
  );
}
