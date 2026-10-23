"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import AndoGlobe from "./AndoGlobe";
import { assetPath, collectionPhotos, type AndoCollection, type AndoPhoto } from "@/lib/ando";
import styles from "./ando.module.css";

function Photo({ photo, className, eager = false }: { photo: AndoPhoto; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className={styles.failedPhoto}>写真を読み込めませんでした</span> : (
    // Dimensions are supplied by the user's image files.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={assetPath(photo.src)} alt={photo.alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />
  );
}

export default function AndoArchive({ collection }: { collection: AndoCollection }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotating, setRotating] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);
  const [lightboxBuildingId, setLightboxBuildingId] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const buildings = useMemo(() => collection.buildings.filter((building) => building.photos.length), [collection]);
  const selected = buildings.find((building) => building.id === selectedId);
  const allPhotos = useMemo(() => collectionPhotos(buildings, null), [buildings]);
  const photos = useMemo(() => selectedId ? allPhotos.filter((photo) => photo.building.id === selectedId) : allPhotos, [allPhotos, selectedId]);
  const lightboxPhotos = useMemo(() => lightboxBuildingId ? allPhotos.filter((photo) => photo.building.id === lightboxBuildingId) : allPhotos, [allPhotos, lightboxBuildingId]);
  const openIndex = lightboxPhotos.findIndex((photo) => photo.id === openPhotoId);
  const openPhoto = lightboxPhotos[openIndex];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setRotating(false);
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  const select = (id: string | null) => {
    setSelectedId(id);
    setOpenPhotoId(null);
    setRotating(false);
  };
  const toggleBuilding = (id: string) => {
    setSelectedId((current) => current === id ? null : id);
    setOpenPhotoId(null);
    setRotating(false);
  };
  const changePhoto = (direction: number) => {
    if (lightboxPhotos.length) setOpenPhotoId(lightboxPhotos[(openIndex + direction + lightboxPhotos.length) % lightboxPhotos.length].id);
  };
  const inspect = (id: string, trigger: HTMLElement) => {
    returnFocus.current = trigger;
    const photo = allPhotos.find((candidate) => candidate.id === id);
    setLightboxBuildingId(photo?.building.id === selectedId ? selectedId : null);
    setOpenPhotoId(id);
    setRotating(false);
  };

  return (
    <main className={styles.archive}>
      <header className={styles.header}>
        <h1>Ando Atlas</h1>
        <a href={assetPath("/#works")} className={styles.backLink}><ArrowLeft size={14} /> Works</a>
      </header>
      <div className={styles.workspace}>
        <AndoGlobe buildings={buildings} selectedId={selectedId} rotating={rotating} reducedMotion={reducedMotion} inspecting={!!openPhoto} onSelect={toggleBuilding} onInspect={inspect} onInteract={() => setRotating(false)} onToggleRotation={() => setRotating((value) => !value)} />
        <section className={styles.photoPanel} aria-labelledby="ando-gallery-title">
          <div className={styles.galleryHeading}>
            <h2 id="ando-gallery-title">写真 <span>{photos.length}枚</span></h2>
            <div className={styles.filterTools}>
              <select aria-label="建築で写真を絞り込む" value={selectedId || ""} onChange={(event) => select(event.target.value || null)}>
                <option value="">すべての建築</option>
                {buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
              </select>
              {selectedId && <button className={styles.clearFilter} onClick={() => select(null)} aria-label="絞り込みを解除"><X size={15} /></button>}
            </div>
          </div>
          <p className={styles.galleryStatus} role="status" aria-live="polite">{selected ? `${selected.name}の写真 ${photos.length}枚を表示` : `すべての写真 ${photos.length}枚を表示`}</p>
          {photos.length ? (
            <div className={styles.gallery}>
              {photos.map((photo) => (
                <button key={photo.id} className={styles.galleryPhoto} onClick={(event) => inspect(photo.id, event.currentTarget)} aria-label={`${photo.alt}を拡大`}>
                  <span className={styles.galleryImage}><Photo photo={photo} /><span className={styles.expandPhoto}><ArrowUpRight size={18} /></span></span>
                  <span className={styles.photoCaption}>{photo.building.name}<small>{photo.building.location}</small></span>
                </button>
              ))}
            </div>
          ) : <p className={styles.emptyState}>写真がありません</p>}
        </section>
      </div>

      <Dialog.Root open={!!openPhoto} onOpenChange={(open) => { if (!open) setOpenPhotoId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.lightboxOverlay} />
          <Dialog.Content className={styles.lightbox} onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus(); }} onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); setOpenPhotoId(null); }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); changePhoto(event.key === "ArrowLeft" ? -1 : 1); }
          }}>
            {openPhoto && <>
              <div className={styles.lightboxHeader}>
                <div><Dialog.Title>{openPhoto.building.name}</Dialog.Title><Dialog.Description>{openPhoto.building.location} · {openIndex + 1} / {lightboxPhotos.length}</Dialog.Description></div>
                <Dialog.Close className={styles.closeLightbox} aria-label="写真を閉じる"><X size={22} /></Dialog.Close>
              </div>
              <div className={styles.lightboxBody}>
                <button className={styles.previousPhoto} onClick={() => changePhoto(-1)} aria-label="前の写真" disabled={lightboxPhotos.length < 2}><ChevronLeft size={24} /></button>
                <Photo key={openPhoto.id} photo={openPhoto} className={styles.lightboxImage} eager />
                <button className={styles.nextPhoto} onClick={() => changePhoto(1)} aria-label="次の写真" disabled={lightboxPhotos.length < 2}><ChevronRight size={24} /></button>
              </div>
              <div className={styles.lightboxFooter}>
                <span>{openPhoto.building.note}</span>
                <span>← → で切り替え / Esc で閉じる</span>
              </div>
            </>}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
