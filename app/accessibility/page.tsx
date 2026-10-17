import Legal from "@/components/Legal";
export const metadata = { title: "Accessibility — What's Going On?" };

export default function Accessibility() {
  return (
    <Legal title="Accessibility" updated="October 17, 2026">
      <p>We want everyone to be able to use What's Going On?. We aim to meet the <strong>Web Content Accessibility Guidelines (WCAG) 2.2, level AA</strong>.</p>
      <h2>What we do</h2>
      <ul>
        <li><strong>No map needed:</strong> &quot;All countries&quot; and search give you every story without using the map. A skip link takes you straight there.</li>
        <li><strong>Keyboard:</strong> every flag, city circle, and button works with Tab, Enter, and Esc.</li>
        <li><strong>Screen readers:</strong> buttons have clear names, and changes (votes, new reviews) are announced.</li>
        <li><strong>Motion:</strong> we follow your device&apos;s &quot;reduce motion&quot; setting.</li>
        <li><strong>Contrast:</strong> text and controls meet AA contrast. Trust levels use icons and words, not only color.</li>
        <li><strong>Plain English:</strong> headlines use simple words and short sentences.</li>
        <li><strong>Zoom and touch:</strong> the layout works at 200% zoom and on small screens, and buttons are at least 44 pixels.</li>
      </ul>
      <h2>Known limits</h2><p>The map itself is visual. Use search or &quot;All countries&quot; for the same content without the map.</p>
      <h2>Feedback</h2><p>Found a barrier? Email <a href="mailto:accessibility@example.com">accessibility@example.com</a> (placeholder).</p>
    </Legal>
  );
}
