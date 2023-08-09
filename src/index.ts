import { spawn } from "node:child_process";
import { Observable } from "rxjs";
import { timeout } from "rxjs/operators";

tracert("www.google.co.th")
  .pipe(timeout(20000))
  .subscribe((value) => {
    console.log(value);
  });

function tracert(url: string) {
  return new Observable<string>((subscriber) => {
    const controller = new AbortController();
    const bat = spawn("tracert", [url], { signal: controller.signal });
    subscriber.add(() => {
      controller.abort();
    });
    let bufferStr = "";
    bat.stdout.on("data", (data) => {
      if (/\s+\d+\s+/.test(data.toString()) && bufferStr !== "") {
        const content = data.toString();
        const [head] = content.split(/\s+\d+\s+/);
        bufferStr += head;
        subscriber.next(bufferStr.trim());
        bufferStr = content.replace(head, "");
      } else {
        bufferStr += data.toString();
      }
    });

    bat.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    bat.on("exit", (code) => {
      console.log(`Child exited with code ${code}`);
      subscriber.complete();
    });
  });
}
