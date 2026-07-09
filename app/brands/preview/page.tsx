import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { BrandPreviewClient } from "@/components/marketplace/BrandPreviewClient";

export default function BrandPreviewPage() {
  return (
    <ThreadocalPage
      eyebrow="Brand profile preview"
      title="Preview"
      intro="Preview the demo brand profile saved locally in this browser."
    >
      <BrandPreviewClient />
    </ThreadocalPage>
  );
}
