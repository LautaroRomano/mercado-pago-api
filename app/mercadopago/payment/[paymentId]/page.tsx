import PaymentForm from "@/app/components/PaymentForm"


export default async function Page({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params
  return  <PaymentForm paymentId={paymentId}/>
}