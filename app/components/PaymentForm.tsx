"use client";

export default function PaymentForm({ paymentId }: { paymentId: string }) {
  console.log(paymentId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const clientEmail = formData.get("clientEmail") as string;
    const cardNumber = formData.get("cardNumber") as string;
    const cardExpirationDate = formData.get("cardExpirationDate") as string;
    const cardCvv = formData.get("cardCvv") as string;
    const cardHolderName = formData.get("cardHolderName") as string;

    const response = await fetch(`/api/mercadopago`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentId,
        clientEmail,
        cardNumber,
        cardExpirationDate,
        cardCvv,
        cardHolderName,
      }),
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    console.log("data: ", data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <input type="text" name="clientEmail" placeholder="Client Email" />
          <input type="text" name="cardNumber" placeholder="Card Number" />
          <input
            type="text"
            name="cardExpirationDate"
            placeholder="Card Expiration Date"
          />
          <input type="text" name="cardCvv" placeholder="Card CVV" />
          <input
            type="text"
            name="cardHolderName"
            placeholder="Card Holder Name"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">
          Submit
        </button>
      </form>
    </div>
  );
}
