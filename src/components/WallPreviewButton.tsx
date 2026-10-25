"use client";

import { useState } from "react";
import { WallIcon } from "./Icons";
import WallPreviewModal from "./WallPreviewModal";

type Props = {
  artSrc: string;
  artAlt: string;
};

/**
 * Trigger for the wall-preview feature. The modal (and its heavy, dynamically
 * imported CV dependencies) isn't mounted until this button is clicked.
 */
export default function WallPreviewButton({ artSrc, artAlt }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary mt-3 w-full">
        <WallIcon className="mr-2 inline-block h-5 w-5" />
        Preview on your wall
      </button>
      {open && <WallPreviewModal artSrc={artSrc} artAlt={artAlt} onClose={() => setOpen(false)} />}
    </>
  );
}
