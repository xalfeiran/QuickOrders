// Simple progress dots for the checkout wizard.
export default function StepIndicator({ steps, current }) {
  return (
    <ol className="steps">
      {steps.map((label, index) => {
        const state =
          index < current ? 'done' : index === current ? 'active' : 'upcoming';
        return (
          <li key={label} className={`steps__item steps__item--${state}`}>
            <span className="steps__dot">{index + 1}</span>
            <span className="steps__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
