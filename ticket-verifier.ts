import { readFile } from "fs/promises";
import chalk from "chalk";

class Verification {
  async verifyTicket(id: string) {
    try {
      const jsonData = await readFile("history.json", "utf-8");
      const data = JSON.parse(jsonData);
      const history = data[id];

      if (!history || new Date(history.validity) < new Date()) {
        throw new Error("Ticket is invalid or expired!");
      }
      console.table(history.guests);
    } catch (error: any) {
      console.error(chalk.red("\n", error.message));
    } finally {
      process.exit(0);
    }
  }
}

const verifier = new Verification();
process.stdout.write(chalk.green("Enter the ticket id to verify: "));

process.stdin.on("data", async (data) => {
  const ticketId = data.toString().trim();
  if (!ticketId) {
    console.error(chalk.red("Please provide a ticket id"));
    process.exit(1);
  }
  await verifier.verifyTicket(ticketId);
});
