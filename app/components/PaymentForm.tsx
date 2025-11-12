"use client";

import { useEffect, useState, useRef } from "react";
import "./PaymentForm.css";

export default function PaymentForm({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Estados para la tarjeta
  const [currentCardBackground, setCurrentCardBackground] = useState(
    Math.floor(Math.random() * 25 + 1)
  );
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardMonth, setCardMonth] = useState("");
  const [cardYear, setCardYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [focusElementStyle, setFocusElementStyle] = useState<{
    width: string;
    height: string;
    transform: string;
  } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [paymentBackUrlCount, setPaymentBackUrlCount] = useState(5);

  const minCardYear = new Date().getFullYear();
  const cardMask = "#### #### #### ####";

  const cardNumberRef = useRef<HTMLLabelElement>(null);
  const cardNameRef = useRef<HTMLLabelElement>(null);
  const cardDateRef = useRef<HTMLDivElement>(null);

  const fetchPayment = async () => {
    const response = await fetch(`/api/mercadopago/payment/${paymentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.errorCode === 404) {
      setNotFound(true);
      setLoading(false);
    } else if (data.errorCode === 200) {
      setPayment(data.payment);
      setLoading(false);
    } else {
      setError(data.error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, []);

  useEffect(() => {
    if (cardNumberRef.current) {
      cardNumberRef.current.focus();
    }
  }, []);

  // Detectar tipo de tarjeta
  const getCardType = (): string => {
    const number = cardNumber.replace(/\s/g, "");
    if (/^4/.test(number)) return "visa";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^6011/.test(number)) return "discover";
    if (/^9792/.test(number)) return "troy";
    return "visa";
  };

  const cardType = getCardType();

  // Calcular mes mínimo
  const minCardMonth =
    cardYear === String(minCardYear) ? new Date().getMonth() + 1 : 1;

  // Formatear número de tarjeta con máscara
  const formatCardNumber = (value: string): string => {
    const numbers = value.replace(/\s/g, "").replace(/\D/g, "");
    const mask = cardMask;
    let formatted = "";
    let numberIndex = 0;

    for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
      if (mask[i] === "#") {
        formatted += numbers[numberIndex];
        numberIndex++;
      } else {
        formatted += mask[i];
      }
    }

    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
    const maxLength = 16;
    if (value.length <= maxLength) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setCardCvv(value);
    }
  };

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value.toUpperCase());
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCardMonth(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCardYear(e.target.value);
  };

  // Efecto para resetear mes si es menor al mínimo
  useEffect(() => {
    if (cardMonth && parseInt(cardMonth) < minCardMonth) {
      setCardMonth("");
    }
  }, [cardYear, minCardMonth]);

  const flipCard = (status: boolean) => {
    setIsCardFlipped(status);
  };

  const focusInput = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setIsInputFocused(true);
    const targetRef = e.currentTarget.dataset.ref;
    let target: HTMLElement | null = null;

    if (targetRef === "cardNumber" && cardNumberRef.current) {
      target = cardNumberRef.current;
    } else if (targetRef === "cardName" && cardNameRef.current) {
      target = cardNameRef.current;
    } else if (targetRef === "cardDate" && cardDateRef.current) {
      target = cardDateRef.current;
    }

    if (target) {
      setFocusElementStyle({
        width: `${target.offsetWidth}px`,
        height: `${target.offsetHeight}px`,
        transform: `translateX(${target.offsetLeft}px) translateY(${target.offsetTop}px)`,
      });
    }
  };

  const blurInput = () => {
    const vm = { isInputFocused };
    setTimeout(() => {
      if (!vm.isInputFocused) {
        setFocusElementStyle(null);
      }
    }, 300);
    setIsInputFocused(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    // Validar campos requeridos
    if (!cardNumber || !cardMonth || !cardYear || !cardCvv || !cardName) {
      setValidationError("Por favor, complete todos los campos");
      return;
    }

    // Convertir formato de fecha MM/YY a MMYY
    const cardExpirationDate = `${cardMonth}${String(cardYear).slice(2, 4)}`;
    const cardNumberClean = cardNumber.replace(/\s/g, "");

    // Validar que el número de tarjeta tenga 16 dígitos
    if (cardNumberClean.length !== 16) {
      setValidationError("El número de tarjeta debe tener 16 dígitos");
      return;
    }

    // Validar que el CVV tenga 3 o 4 dígitos
    if (cardCvv.length < 3 || cardCvv.length > 4) {
      setValidationError("El código de seguridad debe tener 3 o 4 dígitos");
      return;
    }

    setIsValidating(true);

    try {
      // Primero validar la tarjeta
      const validateResponse = await fetch(`/api/mercadopago/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardNumber: cardNumberClean,
          cardExpirationDate,
          cardCvv,
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok || validateData.error) {
        setValidationError(validateData.error || "Error al validar la tarjeta");
        setIsValidating(false);
        return;
      }

      // Si la validación es exitosa, procesar el pago
    const response = await fetch(`/api/mercadopago`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentId,
          clientEmail: payment?.payer?.email || "",
          cardNumber: cardNumberClean,
        cardExpirationDate,
        cardCvv,
          cardHolderName: cardName,
      }),
    });

    const data = await response.json();
    if (data.error) {
        setValidationError(data.error);
        setIsValidating(false);
      return;
    }

      setSuccess(true);
      setValidationError(null);
      setPaymentBackUrlCount(5);
      const interval = setInterval(() => {
        setPaymentBackUrlCount(paymentBackUrlCount - 1);
        if (paymentBackUrlCount === 0) {
          clearInterval(interval);
        }
      }, 1000);
      setTimeout(() => {
        window.location.href = data.backUrl;
      }, paymentBackUrlCount * 1000);
    } catch (err) {
      setValidationError(
        "Error al procesar el pago. Por favor, intente nuevamente."
      );
    } finally {
      setIsValidating(false);
    }
  };

  // Renderizar número de tarjeta con máscara
  const renderCardNumber = () => {
    const mask = cardMask;
    const numbers = cardNumber.replace(/\s/g, "");
    const items: React.ReactElement[] = [];

    // Contador para rastrear la posición en el número sin espacios
    let numberIndex = 0;

    for (let i = 0; i < mask.length; i++) {
      const char = mask[i];
      const isActive = char.trim() === "";

      if (char === "#") {
        // Es una posición para un dígito
        const shouldShow = numberIndex < numbers.length;
        // Enmascarar dígitos del medio (posiciones 4-11 en el número, que son índices 4-11 en numberIndex)
        // Los primeros 4 dígitos (0-3) y los últimos 4 (12-15) se muestran
        const shouldMask = numberIndex >= 4 && numberIndex < 12 && shouldShow;

        if (shouldMask) {
          items.push(
            <div key={i} className="card-item__numberItem">
              *
            </div>
          );
        } else if (shouldShow) {
          items.push(
            <div
              key={i}
              className={`card-item__numberItem ${isActive ? "-active" : ""}`}
            >
              {numbers[numberIndex]}
            </div>
          );
        } else {
          items.push(
            <div
              key={i}
              className={`card-item__numberItem ${isActive ? "-active" : ""}`}
            >
              #
            </div>
          );
        }
        numberIndex++;
      } else {
        // Es un espacio
        items.push(
          <div
            key={i}
            className={`card-item__numberItem ${isActive ? "-active" : ""}`}
          >
            {char}
          </div>
        );
      }
    }

    return items;
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (notFound) {
    return <div>Pago no encontrado</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 12 }, (_, i) => minCardYear + i);

  return (
    <div className="payment-form-wrapper">
      <div className="card-form">
        <div className="card-list">
          <div className={`card-item ${isCardFlipped ? "-active" : ""}`}>
            <div className="card-item__side -front">
              <div
                className={`card-item__focus ${
                  focusElementStyle ? "-active" : ""
                }`}
                style={focusElementStyle || undefined}
              ></div>
              <div className="card-item__cover">
                <img
                  src={`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${currentCardBackground}.jpeg`}
                  className="card-item__bg"
                  alt="Card background"
                />
              </div>

              <div className="card-item__wrapper">
                <div className="card-item__top">
                  <img
                    src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/chip.png"
                    className="card-item__chip"
                    alt="Chip"
                  />
                  <div className="card-item__type">
                    {cardType && (
                      <img
                        src={`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${cardType}.png`}
                        alt={cardType}
                        className="card-item__typeImg"
                      />
                    )}
                  </div>
                </div>
                <label
                  htmlFor="cardNumber"
                  className="card-item__number"
                  ref={cardNumberRef}
                >
                  {renderCardNumber()}
                </label>
                <div className="card-item__content">
                  <label
                    htmlFor="cardName"
                    className="card-item__info"
                    ref={cardNameRef}
                  >
                    <div className="card-item__holder">Titular</div>
                    <div className="card-item__name">
                      {cardName.length > 0 ? (
                        <span>{cardName.replace(/\s\s+/g, " ")}</span>
                      ) : (
                        "Nombre completo"
                      )}
                    </div>
                  </label>
                  <div className="card-item__date" ref={cardDateRef}>
                    <label htmlFor="cardMonth" className="card-item__dateTitle">
                      Expires
                    </label>
                    <label htmlFor="cardMonth" className="card-item__dateItem">
                      <span>{cardMonth || "MM"}</span>
                    </label>
                    /
                    <label htmlFor="cardYear" className="card-item__dateItem">
                      <span>
                        {cardYear ? String(cardYear).slice(2, 4) : "YY"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-item__side -back">
              <div className="card-item__cover">
                <img
                  src={`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${currentCardBackground}.jpeg`}
                  className="card-item__bg"
                  alt="Card background"
                />
              </div>
              <div className="card-item__band"></div>
              <div className="card-item__cvv">
                <div className="card-item__cvvTitle">CVV</div>
                <div className="card-item__cvvBand">
                  {cardCvv.split("").map((_, index) => (
                    <span key={index}>*</span>
                  ))}
                </div>
                <div className="card-item__type">
                  {cardType && (
                    <img
                      src={`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${cardType}.png`}
                      alt={cardType}
                      className="card-item__typeImg"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <form className="card-form__inner" onSubmit={handleSubmit}>
          <div className="card-input">
            <label htmlFor="cardNumber" className="card-input__label">
              Numero de tarjeta
            </label>
            <input
              type="text"
              id="cardNumber"
              className="card-input__input"
              value={cardNumber}
              onChange={handleCardNumberChange}
              onFocus={focusInput}
              onBlur={blurInput}
              data-ref="cardNumber"
              autoComplete="off"
              placeholder="#### #### #### ####"
            />
          </div>
          <div className="card-input">
            <label htmlFor="cardName" className="card-input__label">
              Titular
            </label>
          <input
            type="text"
              id="cardName"
              className="card-input__input"
              value={cardName}
              onChange={handleCardNameChange}
              onFocus={focusInput}
              onBlur={blurInput}
              data-ref="cardName"
              autoComplete="off"
            />
          </div>
          <div className="card-form__row">
            <div className="card-form__col">
              <div className="card-form__group">
                <label htmlFor="cardMonth" className="card-input__label">
                  Fecha de expiracion
                </label>
                <select
                  className="card-input__input -select"
                  id="cardMonth"
                  value={cardMonth}
                  onChange={handleMonthChange}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  data-ref="cardDate"
                >
                  <option value="" disabled>
                    Mes
                  </option>
                  {months.map((n) => (
                    <option
                      key={n}
                      value={n < 10 ? `0${n}` : `${n}`}
                      disabled={n < minCardMonth}
                    >
                      {n < 10 ? `0${n}` : `${n}`}
                    </option>
                  ))}
                </select>
                <select
                  className="card-input__input -select"
                  id="cardYear"
                  value={cardYear}
                  onChange={handleYearChange}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  data-ref="cardDate"
                >
                  <option value="" disabled>
                    Año
                  </option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-form__col -cvv">
              <div className="card-input">
                <label htmlFor="cardCvv" className="card-input__label">
                  Codigo de seguridad
                </label>
          <input
            type="text"
                  className="card-input__input"
                  id="cardCvv"
                  value={cardCvv}
                  onChange={handleCardCvvChange}
                  onFocus={() => flipCard(true)}
                  onBlur={() => flipCard(false)}
                  autoComplete="off"
                  maxLength={4}
                  placeholder="####"
          />
        </div>
            </div>
          </div>

          {validationError && (
            <div className="card-form__error">{validationError}</div>
          )}

          {success && (
            <div className="card-form__success">
              ¡Pago procesado exitosamente!
            </div>
          )}

          <button
            type="submit"
            className="card-form__button"
            disabled={
              isValidating || success || payment?.paymentStatus === "approved"
            }
          >
            {isValidating ? "Validando..." : "Pagar"}
        </button>

          {success && (
            <div className="card-form__info">
              Redirigiendo en {paymentBackUrlCount} segundos...
            </div>
          )}
      </form>
      </div>
    </div>
  );
}
