import { useEffect, useRef } from "react";
import p5 from "p5";

const LiquidBlobs = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sketch = (p: p5) => {
      let blobs: Blob[] = [];

      class Blob {
        x: number;
        y: number;
        baseR: number;
        noiseOffset: number;
        speed: number;

        constructor(x: number, y: number, r: number) {
          this.x = x;
          this.y = y;
          this.baseR = r;
          this.noiseOffset = p.random(1000);
          this.speed = p.random(0.003, 0.008);
        }

        update() {
          this.noiseOffset += this.speed;

          // subtle drifting motion (important for "liquid" feel)
          this.x += p.sin(this.noiseOffset) * 0.3;
          this.y += p.cos(this.noiseOffset * 0.8) * 0.3;
        }

        draw() {
          p.beginShape();

          for (let a = 0; a < p.TWO_PI; a += 0.05) {
            // 2D noise for richer deformation
            let nx = Math.cos(a) + 1;
            let ny = Math.sin(a) + 1;

            let noiseVal = p.noise(
              nx * 1.2 + this.noiseOffset,
              ny * 1.2 + this.noiseOffset
            );

            // stronger distortion range
            let r = this.baseR + noiseVal * 50;

            let x = this.x + r * Math.cos(a);
            let y = this.y + r * Math.sin(a);

            p.vertex(x, y);
          }

          p.endShape(p.CLOSE);
        }
      }

      p.setup = () => {
        const parent = containerRef.current!;
        const canvas = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
        canvas.parent(parent);

        blobs = [
          new Blob(p.width * 0.7, p.height * 0.1, 70),
          new Blob(p.width * 0.3, p.height * 0.4, 90),
        ];
      };

      p.draw = () => {
        p.clear();

        const isDark =
          document.documentElement.classList.contains("dark");

        p.noStroke();

        // softer + layered transparency
        if (isDark) {
          p.fill(255, 120, 180, 30);
        } else {
          p.fill(255, 100, 150, 25);
        }

        blobs.forEach((b) => {
          b.update();
          b.draw();
        });
      };

      p.windowResized = () => {
        const parent = containerRef.current!;
        p.resizeCanvas(parent.offsetWidth, parent.offsetHeight);
      };
    };

    const instance = new p5(sketch);

    return () => instance.remove();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full pointer-events-none"
    />
  );
};

export default LiquidBlobs;