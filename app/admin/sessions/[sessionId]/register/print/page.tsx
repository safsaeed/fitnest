import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { PrintButton } from "./print-button";
import { formatDate, formatFullDateTime } from "@/lib/formatters";

type PrintRegisterPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function PrintRegisterPage({
  params,
}: PrintRegisterPageProps) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    redirect("/admin/login");
  }

  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      venue: true,
      bookings: {
        where: {
          status: "CONFIRMED",
        },
        include: {
          children: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  const children = session.bookings.flatMap((booking) =>
    booking.children.map((child) => ({
      id: child.id,
      name: [child.firstName, child.lastName].filter(Boolean).join(" "),
    })),
  );

  const registerRows = Array.from(
    { length: Math.max(children.length, 16) },
    (_, index) => children[index] ?? null,
  );

  const sessionDate = formatDate(session.startsAt);
  const sessionDateTime = formatFullDateTime(session.startsAt);
  const venueName = session.venue.name;

  return (
    <main className="bg-white p-6 text-black print:p-0">
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Print session pack</h1>
          <p className="text-sm text-(--color-text-secondary)">
            {session.title} · {session.venue.name}
          </p>
        </div>

        <PrintButton />
      </div>

      <div className="mx-auto max-w-6xl print:max-w-none">
        <AttendanceRegister
          title={session.title}
          dateTime={sessionDateTime}
          rows={registerRows}
        />

        <PrintPageBreak />

        <SiteSafetyChecklist date={sessionDate} venue={venueName} />

        <PrintPageBreak />

        <EquipmentSafetyChecklist date={sessionDate} venue={venueName} />

        <PrintPageBreak />

        <EquipmentCleaningLog date={sessionDate} venue={venueName} />
      </div>
    </main>
  );
}

function AttendanceRegister({
  title,
  dateTime,
  rows,
}: {
  title: string;
  dateTime: string;
  rows: Array<{ id: string; name: string } | null>;
}) {
  return (
    <section className="print-page">
      <div className="border-2 border-black">
        <div className="border-b-2 border-black px-4 py-3 text-center text-lg font-bold">
          Daily Attendance Register
        </div>

        <div className="border-b-2 border-black px-4 py-4 text-center text-base font-bold">
          {title}
        </div>

        <div className="border-b-2 border-black px-4 py-3 text-center text-base font-bold">
          {dateTime}
        </div>

        <div className="grid grid-cols-[1.2fr_1fr_1fr_2fr] border-b-2 border-black text-center font-bold">
          <div className="border-r-2 border-black px-3 py-2">Child Name</div>
          <div className="border-r-2 border-black px-3 py-2">Time In</div>
          <div className="border-r-2 border-black px-3 py-2">Time Out</div>
          <div className="px-3 py-2">Parent Name / Signature</div>
        </div>

        {rows.map((child, index) => (
          <div
            key={child?.id ?? `empty-${index}`}
            className="grid min-h-11 grid-cols-[1.2fr_1fr_1fr_2fr] border-b border-black last:border-b-0"
          >
            <div className="border-r border-black px-3 py-2 font-medium">
              {child?.name ?? ""}
            </div>
            <div className="border-r border-black px-3 py-2" />
            <div className="border-r border-black px-3 py-2" />
            <div className="px-3 py-2" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SiteSafetyChecklist({ date, venue }: { date: string; venue: string }) {
  const checks = [
    "Floors clean and hazard-free",
    "Equipment checked and safe",
    "Fire exits clear",
    "First aid kit present",
    "Register ready",
    "Entry/exit secure",
  ];

  return (
    <section className="print-page">
      <DocumentTitle>Daily Site Safety Checklist</DocumentTitle>

      <SmallInfoTable date={date} venue={venue} />

      <div className="mt-4 border-2 border-black text-base">
        {checks.map((check) => (
          <div
            key={check}
            className="grid grid-cols-[1.1fr_1.7fr] border-b border-black last:border-b-0"
          >
            <div className="border-r border-black px-2 py-2 font-medium">
              {check}
            </div>
            <div className="px-2 py-2 text-center font-medium">
              □ Yes&nbsp;&nbsp;&nbsp;□ No
            </div>
          </div>
        ))}
      </div>

      <SignatureRow label="Staff Name / Signature" />
    </section>
  );
}

function EquipmentSafetyChecklist({
  date,
  venue,
}: {
  date: string;
  venue: string;
}) {
  const rows = Array.from({ length: 20 }, (_, index) => index);

  return (
    <section className="print-page">
      <DocumentTitle>Daily Equipment Safety Checklist</DocumentTitle>

      <SmallInfoTable date={date} venue={venue} />

      <div className="mt-4 border-2 border-black text-sm">
        <div className="grid grid-cols-[1.25fr_1fr_1fr_1fr] border-b-2 border-black text-center font-bold">
          <div className="border-r border-black px-2 py-2">Equipment</div>
          <div className="border-r border-black px-2 py-2">
            Condition (Fit for Use)
          </div>
          <div className="border-r border-black px-2 py-2">
            Action Taken (If No)
          </div>
          <div className="px-2 py-2">Checked By</div>
        </div>

        {rows.map((row) => (
          <div
            key={row}
            className="grid min-h-9 grid-cols-[1.25fr_1fr_1fr_1fr] border-b border-black last:border-b-0"
          >
            <div className="border-r border-black px-2 py-1" />
            <div className="border-r border-black px-2 py-1 text-center">
              □ Yes&nbsp;&nbsp;&nbsp;□ No
            </div>
            <div className="border-r border-black px-2 py-1" />
            <div className="px-2 py-1" />
          </div>
        ))}
      </div>
    </section>
  );
}

function EquipmentCleaningLog({
  date,
  venue,
}: {
  date: string;
  venue: string;
}) {
  const rows = Array.from({ length: 20 }, (_, index) => index);

  return (
    <section className="print-page">
      <DocumentTitle>Daily Equipment Cleaning Log</DocumentTitle>

      <SmallInfoTable date={date} venue={venue} />

      <div className="mt-4 border-2 border-black text-sm">
        <div className="grid grid-cols-[1.25fr_1fr_1fr_1fr] border-b-2 border-black text-center font-bold">
          <div className="border-r border-black px-2 py-2">Area/Equipment</div>
          <div className="border-r border-black px-2 py-2">Cleaned</div>
          <div className="border-r border-black px-2 py-2">Time</div>
          <div className="px-2 py-2">Cleaned By</div>
        </div>

        {rows.map((row) => (
          <div
            key={row}
            className="grid min-h-9 grid-cols-[1.25fr_1fr_1fr_1fr] border-b border-black last:border-b-0"
          >
            <div className="border-r border-black px-2 py-1" />
            <div className="border-r border-black px-2 py-1 text-center">
              □ Yes&nbsp;&nbsp;&nbsp;□ No
            </div>
            <div className="border-r border-black px-2 py-1" />
            <div className="px-2 py-1" />
          </div>
        ))}
      </div>
    </section>
  );
}

function DocumentTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-black px-4 py-2 text-center text-lg font-bold">
      {children}
    </div>
  );
}

function SmallInfoTable({ date, venue }: { date: string; venue: string }) {
  return (
    <div className="mt-3 w-full border-2 border-black sm:w-1/2 print:w-1/2">
      <div className="grid grid-cols-[0.9fr_1.6fr] border-b border-black">
        <div className="border-r border-black px-3 py-2 text-center font-bold">
          Date
        </div>
        <div className="px-3 py-2">{date}</div>
      </div>

      <div className="grid grid-cols-[0.9fr_1.6fr]">
        <div className="border-r border-black px-3 py-2 text-center font-bold">
          Venue
        </div>
        <div className="px-3 py-2">{venue}</div>
      </div>
    </div>
  );
}

function SignatureRow({ label }: { label: string }) {
  return (
    <div className="mt-4 w-full border-2 border-black">
      <div className="grid grid-cols-[0.9fr_1.6fr]">
        <div className="border-r border-black px-3 py-2 text-center font-bold">
          {label}
        </div>
        <div className="px-3 py-2" />
      </div>
    </div>
  );
}

function PrintPageBreak() {
  return <div className="my-8 print:my-0 print:break-before-page" />;
}
