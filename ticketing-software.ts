import process from "process";
import chalk from "chalk";
import z from "zod";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";

interface GuestDetails {
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
}

const GuestValidation = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().refine((val) => val.length === 10, {
    message: "Phone number must be 10 digits long",
  }),
  email: z.string().email({ message: "Invalid email format" }),
});

const TICKET_PRICES: Record<string, number> = {
  infant: 0,
  child: 100,
  adult: 500,
  senior: 300,
};

class Guest {
  private name: string;
  private age: number;
  private gender: string;
  private phone: string;
  private email: string;

  constructor(details: GuestDetails) {
    this.name = details.name;
    this.age = details.age;
    this.gender = details.gender;
    this.phone = details.phone;
    this.email = details.email;
  }

  public getDetails(): string {
    return `${this.name} ${this.age} ${this.phone} ${this.email}`;
  }

  public getTicketType(): string {
    if (this.age <= 2) return "infant";
    else if (this.age < 18) return "child";
    else if (this.age < 60) return "adult";
    else return "senior";
  }
}

class TicketingSoftware {
  private totalGuests: number;
  private guests: Guest[];
  private ticketId: string = "";

  constructor(totalGuests: number) {
    this.totalGuests = totalGuests;
    this.guests = [];
  }

  public addGuest(guest: Guest): void {
    this.guests.push(guest);
  }

  public getTotalPrice(): number {
    return this.guests.reduce((total, guest) => {
      const ticketType = guest.getTicketType();
      return total + TICKET_PRICES[ticketType];
    }, 0);
  }

  public saveHistory(): void {
    const history = this.guests.map((guest) => {
      const details = guest.getDetails();
      const ticketPrice = TICKET_PRICES[guest.getTicketType()];
      return { details, ticketPrice };
    });
    this.ticketId = uuidv4();
    const newHistory = {
      [this.ticketId]: {
        guests: history,
        totalPrice: this.getTotalPrice(),
        validity: new Date().getTime() + 86400000,
      },
    };
    try {
      if (!existsSync("history.json")) {
        writeFileSync("history.json", JSON.stringify(newHistory));
      } else {
        const jsonData = readFileSync("history.json", "utf-8");
        const data = JSON.parse(jsonData);
        writeFileSync(
          "history.json",
          JSON.stringify({ ...data, ...newHistory })
        );
      }
    } catch (error) {
      console.error("Error saving history:", error);
    }
  }

  public printTicket(): void {
    const guestData = this.guests.map((guest) => {
      const details = guest.getDetails();
      const ticketPrice = TICKET_PRICES[guest.getTicketType()];
      return { details, "Ticket Price (Rs)": ticketPrice };
    });

    const totalPrice = this.getTotalPrice();

    console.log(`\n===== Ticket Details: ${this.ticketId} =====\n`);
    console.table(guestData);
    console.log(`Ticket ID: ${this.ticketId}`);
    console.log(`Total Price: ${totalPrice} Rs`);
  }
}

process.title = "Ticketing Software";

process.stdout.write(chalk.green("Enter the total number of guests: "));

let totalGuests: number;
let currentIndex = 0;
let ticketCounter: TicketingSoftware;

process.stdin.on("data", async (data) => {
  try {
    if (!totalGuests && data.toString().trim() !== "yes") {
      totalGuests = parseInt(data.toString().trim());
      ticketCounter = new TicketingSoftware(totalGuests);
      if (isNaN(totalGuests) || totalGuests <= 0) {
        throw new Error(
          "Invalid input. Please enter a valid number of guests."
        );
      }
      process.stdout.write(
        chalk.green(
          `Enter guest ${
            currentIndex + 1
          } details (name, age, phone, email, gender): `
        )
      );
    } else {
      const [name, age, phone, email, gender] = data
        .toString()
        .trim()
        .split(",");

      if (!name || !age || !phone || !email || !gender) {
        throw new Error("Invalid input format. Please provide all details.");
      }
      const guestDetails: GuestDetails = {
        name: name.trim(),
        age: parseInt(age.trim()),
        gender: gender.trim(),
        phone: phone.trim(),
        email: email.trim(),
      };
      let validationResult = GuestValidation.safeParse(guestDetails);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(
          (err: any) => err.message
        );
        throw new Error(errorMessages.join("\n"));
      }
      const guest = new Guest(guestDetails);
      ticketCounter.addGuest(guest);
      currentIndex++;
      if (currentIndex < totalGuests) {
        process.stdout.write(
          chalk.green(
            `Enter guest ${
              currentIndex + 1
            } details (name, age, phone, email, gender): `
          )
        );
      } else {
        ticketCounter.saveHistory();
        ticketCounter.printTicket();
        process.exit();
      }
    }
  } catch (error: any) {
    console.error(chalk.red(`${error.message}`));
    process.exit(1);
  }
});
