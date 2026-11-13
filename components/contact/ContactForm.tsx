"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";

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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validate(values);
    setErrors(result);
    if (Object.keys(result).length === 0) {
      const message = [
        "Hola, MariArte. Les escribo desde la web.",
        `Nombre: ${values.name.trim()}`,
        `Contacto: ${values.contact.trim()}`,
        `Motivo: ${values.topic}`,
        "",
        values.message.trim(),
      ].join("\n");
      window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    } else {
      const firstKey = Object.keys(result)[0];
      document.getElementById(`contact-${firstKey}`)?.focus();
    }
  }

  const fieldError = (key: keyof FormState) =>
    errors[key] ? (
      <p id={`contact-${key}-error`} className="field-error">
        <AlertCircle size={14} /> {errors[key]}
      </p>
    ) : null;

  return (
    <form noValidate onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8">
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
      <button type="submit" className="btn btn-primary w-full">Enviar por WhatsApp</button>
      <p className="text-center text-[12px] text-muted">
        Se abrirá WhatsApp con tu mensaje listo. Tú decides cuándo enviarlo.
      </p>
    </form>
  );
}
