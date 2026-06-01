export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon-wrap">
          <Icon size={22} />
        </div>
      )}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {text && <p className="empty-state-text">{text}</p>}
      {children}
    </div>
  );
}
