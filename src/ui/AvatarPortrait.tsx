import { avatarById } from "../content/avatars";
import type { AvatarId } from "../domain/models";

export function AvatarPortrait({
  avatarId,
  className = "",
}: {
  avatarId: AvatarId;
  className?: string;
}) {
  const avatar = avatarById(avatarId);
  return (
    <span
      className={`avatar-portrait avatar-motion--${avatar.motion} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="avatar-aura" />
      <b className="avatar-fallback">{avatar.name.slice(0, 1)}</b>
      <img
        src={avatar.image}
        alt=""
        draggable={false}
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </span>
  );
}
