import fs from "node:fs";
import path from "node:path";

function getHomepageSource() {
  const homepagePath = path.resolve(process.cwd(), "index.html");
  const html = fs.readFileSync(homepagePath, "utf8");

  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);

  if (!styleMatch || !bodyMatch) {
    throw new Error("Could not extract homepage markup from positionperfect/index.html");
  }

  const fontImport =
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');";

  return {
    css: `${fontImport}\n${styleMatch[1].trim()}`,
    body: bodyMatch[1].trim(),
  };
}

export default function Home() {
  const homepage = getHomepageSource();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: homepage.css }} />
      <main dangerouslySetInnerHTML={{ __html: homepage.body }} />
    </>
  );
}
