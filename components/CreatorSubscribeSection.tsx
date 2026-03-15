"use client";

import { useState } from "react";
import { SubscribeButton } from "@/components/SubscribeButton";
import { SubscribeModal } from "@/components/SubscribeModal";

interface CreatorSubscribeSectionProps {
  readonly creatorId?: string;
  readonly creatorName: string;
  readonly creatorUsername: string;
  readonly subscriptionPrice: number;
  readonly premiumPrice?: number | null;
  readonly vipPrice?: number | null;
}

export function CreatorSubscribeSection({
  creatorId,
  creatorName,
  creatorUsername,
  subscriptionPrice,
  premiumPrice,
  vipPrice,
}: CreatorSubscribeSectionProps) {
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  return (
    <>
      <SubscribeButton
        price={subscriptionPrice}
        size="default"
        onSubscribe={() => setShowSubscribeModal(true)}
      />
      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        creatorId={creatorId}
        creatorName={creatorName}
        creatorUsername={creatorUsername}
        price={subscriptionPrice}
        premiumPrice={premiumPrice}
        vipPrice={vipPrice}
      />
    </>
  );
}
