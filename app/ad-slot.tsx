type AdSlotProps = { placement: "home-leaderboard" | "home-footer" };

export function AdSlot({ placement }: AdSlotProps) {
  return (
    <aside className={`ad-slot ad-slot-${placement}`} aria-label="Advertisement">
      <span>ADVERTISEMENT</span>
      <p>Reserved for an approved advertising partner</p>
    </aside>
  );
}
