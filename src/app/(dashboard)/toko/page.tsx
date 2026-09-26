import { getStoreSetupData } from "@/actions/store";
import { getPaymentMethods } from "@/actions/payment-methods";
import { PaymentMethodsCard } from "@/components/store/payment-methods-card";
import { TokoClient } from "./toko-client";

export default async function TokoPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const { store, businessName } = await getStoreSetupData();
  const paymentMethods = store ? await getPaymentMethods() : [];

  return (
    <>
      <TokoClient initialStore={store} businessName={businessName} isWelcome={welcome === "1"} />
      {store && <PaymentMethodsCard initialMethods={paymentMethods} />}
    </>
  );
}
