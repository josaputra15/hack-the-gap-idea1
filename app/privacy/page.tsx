import Legal, { Callout } from "@/components/Legal";
import ClearData from "./ClearData";
export const metadata = { title: "Privacy Policy — What's Going On?" };

export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="October 17, 2026">
      <Callout><p><strong>In short:</strong> this prototype has no accounts and no server. Your votes, reviews, and settings are saved only in your own browser.</p></Callout>
      <h2>What we store</h2>
      <ul>
        <li><strong>Votes</strong>, so we remember how you voted.</li>
        <li><strong>Reviews</strong> you write, so you can see them.</li>
        <li><strong>Which local stories you have watched</strong>, so the circles turn grey.</li>
      </ul>
      <p>All of this stays in your browser&apos;s local storage. Nobody else can see it.</p>
      <h2>Third parties</h2><p>To draw the map, your browser loads map tiles from OpenFreeMap. Like any website request, this service can see your IP address.</p>
      <h2>Cookies</h2><p>What's Going On? does not use tracking or advertising cookies.</p>
      <h2>Deleting your data</h2><p>Clear this site&apos;s data in your browser settings, or press the button below.</p>
      <ClearData />
      <h2>Children</h2><p>What's Going On? is not meant for children under 13.</p>
      <h2>Future versions</h2><p>If we add accounts or a server, we will update this policy before we collect any new data.</p>
    </Legal>
  );
}
