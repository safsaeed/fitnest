import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateBookingAccessToken } from "../lib/booking-access-token";

function daysFromNow(days: number, hours = 9, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);

  return next;
}

function childDob(ageYears: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - ageYears);
  date.setMonth(5);
  date.setDate(15);
  date.setHours(0, 0, 0, 0);

  return date;
}

function createBookingReference(index: number) {
  return `FIT-DEMO-${String(index).padStart(3, "0")}`;
}

async function main() {
  console.log("Seeding database...");

  /*
    Delete dependent records first so relations do not block the reset.
  */
  await prisma.child.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.parentChild.deleteMany();
  await prisma.parentUser.deleteMany();
  await prisma.session.deleteMany();
  await prisma.sessionSeries.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.venueInterest.deleteMany();
  await prisma.adminUser.deleteMany();

  /*
    Shared demo passwords.
  */
  const adminPassword = "ChangeMe123!";
  const parentPassword = "ParentDemo123!";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const parentPasswordHash = await bcrypt.hash(parentPassword, 12);

  /*
    Admin user.
  */
  const adminUser = await prisma.adminUser.create({
    data: {
      name: "Admin User",
      email: "admin@fitnest.local",
      passwordHash: adminPasswordHash,
      role: "OWNER",
      isActive: true,
    },
  });

  /*
    Parent accounts and membership examples.
  */

  const sarahParent = await prisma.parentUser.create({
    data: {
      name: "Sarah Thompson",
      email: "sarah@example.com",
      phone: "07123456789",
      passwordHash: parentPasswordHash,
      defaultEmergencyContactName: "James Thompson",
      defaultEmergencyContactPhone: "07987654321",
      stripeCustomerId: "cus_test_sarah_active",
      isActive: true,
      membership: {
        create: {
          status: "ACTIVE",
          stripeSubscriptionId: "sub_test_sarah_active",
          stripePriceId: "price_test_membership_monthly",
          currentPeriodStart: daysFromNow(-10),
          currentPeriodEnd: daysFromNow(20),
          cancelAtPeriodEnd: false,
        },
      },
      children: {
        create: [
          {
            firstName: "Oliver",
            lastName: "Thompson",
            dateOfBirth: childDob(8),
            allergies: "None",
            medicalNotes: "None",
            isActive: true,
          },
          {
            firstName: "Amelia",
            lastName: "Thompson",
            dateOfBirth: childDob(6),
            allergies: "Peanuts",
            medicalNotes: "Carries antihistamine.",
            isActive: true,
          },
        ],
      },
    },
    include: {
      children: true,
      membership: true,
    },
  });

  const michaelParent = await prisma.parentUser.create({
    data: {
      name: "Michael Brown",
      email: "michael@example.com",
      phone: "07000111222",
      passwordHash: parentPasswordHash,
      defaultEmergencyContactName: "Laura Brown",
      defaultEmergencyContactPhone: "07000333444",
      stripeCustomerId: null,
      isActive: true,
      children: {
        create: [
          {
            firstName: "Noah",
            lastName: "Brown",
            dateOfBirth: childDob(7),
            allergies: "None",
            medicalNotes: "Asthma - inhaler in bag.",
            isActive: true,
          },
        ],
      },
    },
    include: {
      children: true,
      membership: true,
    },
  });

  const amanParent = await prisma.parentUser.create({
    data: {
      name: "Aman Khan",
      email: "aman@example.com",
      phone: "07473111111",
      passwordHash: parentPasswordHash,
      defaultEmergencyContactName: "Aman Khan",
      defaultEmergencyContactPhone: "07473111111",
      stripeCustomerId: "cus_test_aman_cancelling",
      isActive: true,
      membership: {
        create: {
          status: "ACTIVE",
          stripeSubscriptionId: "sub_test_aman_cancelling",
          stripePriceId: "price_test_membership_monthly",
          currentPeriodStart: daysFromNow(-20),
          currentPeriodEnd: daysFromNow(10),
          cancelAtPeriodEnd: true,
          cancelledAt: new Date(),
        },
      },
      children: {
        create: [
          {
            firstName: "Mark",
            lastName: "David",
            dateOfBirth: childDob(1),
            allergies: "Peanuts",
            medicalNotes: "None",
            isActive: true,
          },
          {
            firstName: "Charles",
            lastName: "David",
            dateOfBirth: childDob(1),
            allergies: "None",
            medicalNotes: "None",
            isActive: true,
          },
          {
            firstName: "Sofia",
            lastName: "Khan",
            dateOfBirth: childDob(2),
            allergies: "Dairy intolerance",
            medicalNotes: "Parent prefers a call if upset.",
            isActive: true,
          },
          {
            firstName: "Adam",
            lastName: "Khan",
            dateOfBirth: childDob(6),
            allergies: "None",
            medicalNotes: "None",
            isActive: true,
          },
        ],
      },
    },
    include: {
      children: true,
      membership: true,
    },
  });

  const rachelParent = await prisma.parentUser.create({
    data: {
      name: "Rachel Adams",
      email: "rachel@example.com",
      phone: "07333123456",
      passwordHash: parentPasswordHash,
      defaultEmergencyContactName: "Tom Adams",
      defaultEmergencyContactPhone: "07333987654",
      stripeCustomerId: "cus_test_rachel_past_due",
      isActive: true,
      membership: {
        create: {
          status: "PAST_DUE",
          stripeSubscriptionId: "sub_test_rachel_past_due",
          stripePriceId: "price_test_membership_monthly",
          currentPeriodStart: daysFromNow(-31),
          currentPeriodEnd: daysFromNow(-1),
          cancelAtPeriodEnd: false,
        },
      },
      children: {
        create: [
          {
            firstName: "Freddie",
            lastName: "Adams",
            dateOfBirth: childDob(5),
            allergies: "None",
            medicalNotes: "None",
            isActive: true,
          },
        ],
      },
    },
    include: {
      children: true,
      membership: true,
    },
  });

  const cancelledMembershipParent = await prisma.parentUser.create({
    data: {
      name: "Olivia Carter",
      email: "olivia@example.com",
      phone: "07000999111",
      passwordHash: parentPasswordHash,
      defaultEmergencyContactName: "Sam Carter",
      defaultEmergencyContactPhone: "07000999222",
      stripeCustomerId: "cus_test_olivia_cancelled",
      isActive: true,
      membership: {
        create: {
          status: "CANCELLED",
          stripeSubscriptionId: "sub_test_olivia_cancelled",
          stripePriceId: "price_test_membership_monthly",
          currentPeriodStart: daysFromNow(-35),
          currentPeriodEnd: daysFromNow(-5),
          cancelAtPeriodEnd: false,
          cancelledAt: daysFromNow(-20),
        },
      },
      children: {
        create: [
          {
            firstName: "Ruby",
            lastName: "Carter",
            dateOfBirth: childDob(5),
            allergies: "None",
            medicalNotes: "None",
            isActive: true,
          },
        ],
      },
    },
    include: {
      children: true,
      membership: true,
    },
  });

  const sarahOliver = sarahParent.children.find(
    (child) => child.firstName === "Oliver",
  )!;

  const sarahAmelia = sarahParent.children.find(
    (child) => child.firstName === "Amelia",
  )!;

  const michaelNoah = michaelParent.children.find(
    (child) => child.firstName === "Noah",
  )!;

  const amanMark = amanParent.children.find(
    (child) => child.firstName === "Mark",
  )!;

  const amanCharles = amanParent.children.find(
    (child) => child.firstName === "Charles",
  )!;

  const amanSofia = amanParent.children.find(
    (child) => child.firstName === "Sofia",
  )!;

  const amanAdam = amanParent.children.find(
    (child) => child.firstName === "Adam",
  )!;

  const rachelFreddie = rachelParent.children.find(
    (child) => child.firstName === "Freddie",
  )!;

  /*
    Venue interest examples.
  */
  const venueInterests = await prisma.venueInterest.createMany({
    data: [
      {
        parentEmail: "laura.hill@example.com",
        city: "Barnsley",
        venueName: "Barnsley Metrodome",
        notes:
          "Would be great for weekend morning sessions. Lots of families nearby.",
        status: "NEW",
      },
      {
        parentEmail: "daniel.price@example.com",
        city: "Wakefield",
        venueName: "Lightwaves Leisure Centre",
        notes: "After-school sessions would be useful during weekdays.",
        status: "NEW",
      },
      {
        parentEmail: "megan.evans@example.com",
        city: "Rotherham",
        venueName: "Rotherham Leisure Complex",
        notes: "Good parking and easy access from nearby schools.",
        status: "REVIEWED",
      },
      {
        parentEmail: "yasmin.ali@example.com",
        city: "Leeds",
        venueName: "John Charles Centre for Sport",
        notes:
          "There is strong demand locally, especially during school holidays.",
        status: "CONTACTED",
      },
      {
        parentEmail: "tom.walker@example.com",
        city: "Sheffield",
        venueName: "Ponds Forge",
        notes: null,
        status: "ARCHIVED",
      },
      {
        parentEmail: "rebecca.king@example.com",
        city: "Doncaster",
        venueName: "The Dome Doncaster",
        notes: "Would prefer Sunday sessions if possible.",
        status: "NEW",
      },
    ],
  });

  /*
    Venues and sessions.

    pricePence = standard customer price
    memberPricePence = active membership price, when available
  */
  const doncasterVenue = await prisma.venue.create({
    data: {
      name: "Fitnest Doncaster Sports Centre",
      addressLine1: "123 Test Street",
      city: "Doncaster",
      county: "South Yorkshire",
      postcode: "DN1 1AA",
      country: "UK",
      latitude: 53.5228,
      longitude: -1.1285,
      sessions: {
        create: [
          {
            title: "Kids Sports Session",
            description: "A fun on-site session for children.",
            startsAt: daysFromNow(3, 10, 0),
            endsAt: addHours(daysFromNow(3, 10, 0), 1),
            capacity: 12,
            pricePence: 1000,
            memberPricePence: 700,
            minAge: 4,
            maxAge: 12,
            isActive: true,
          },
          {
            title: "After School Play Sessions Club",
            description: "An active after-school session.",
            startsAt: daysFromNow(5, 16, 0),
            endsAt: addHours(daysFromNow(5, 16, 0), 1),
            capacity: 10,
            pricePence: 1200,
            memberPricePence: 900,
            minAge: 5,
            maxAge: 13,
            isActive: true,
          },
          {
            title: "Mini Movers",
            description:
              "Movement, games and coordination for younger children.",
            startsAt: daysFromNow(8, 9, 30),
            endsAt: addHours(daysFromNow(8, 9, 30), 1),
            capacity: 8,
            pricePence: 900,
            memberPricePence: 700,
            minAge: 1,
            maxAge: 4,
            isActive: true,
          },
        ],
      },
    },
    include: {
      sessions: true,
    },
  });

  const sheffieldVenue = await prisma.venue.create({
    data: {
      name: "Fitnest Sheffield Arena",
      addressLine1: "45 Example Road",
      city: "Sheffield",
      county: "South Yorkshire",
      postcode: "S1 2AB",
      country: "UK",
      latitude: 53.3811,
      longitude: -1.4701,
      sessions: {
        create: [
          {
            title: "Weekend Kids Session",
            description: "Weekend sports and play sessions for children.",
            startsAt: daysFromNow(7, 11, 30),
            endsAt: addHours(daysFromNow(7, 11, 30), 1),
            capacity: 10,
            pricePence: 1000,
            memberPricePence: 700,
            minAge: 4,
            maxAge: 12,
            isActive: true,
          },
          {
            title: "Bi-daily Cricket",
            description: "Bi-daily cricket sessions for children.",
            startsAt: daysFromNow(2, 13, 0),
            endsAt: addHours(daysFromNow(2, 13, 0), 3),
            capacity: 10,
            pricePence: 1000,
            memberPricePence: 700,
            minAge: 1,
            maxAge: 8,
            isActive: true,
          },
          {
            title: "Bi-daily Cricket",
            description: "Bi-daily cricket sessions for children.",
            startsAt: daysFromNow(4, 13, 0),
            endsAt: addHours(daysFromNow(4, 13, 0), 3),
            capacity: 10,
            pricePence: 1000,
            memberPricePence: 700,
            minAge: 1,
            maxAge: 8,
            isActive: true,
          },
          {
            title: "Bi-daily Cricket",
            description: "Bi-daily cricket sessions for children.",
            startsAt: daysFromNow(6, 13, 0),
            endsAt: addHours(daysFromNow(6, 13, 0), 3),
            capacity: 10,
            pricePence: 1000,
            memberPricePence: 700,
            minAge: 1,
            maxAge: 8,
            isActive: true,
          },
        ],
      },
    },
    include: {
      sessions: true,
    },
  });

  const leedsVenue = await prisma.venue.create({
    data: {
      name: "Fitnest Leeds Community Hub",
      addressLine1: "18 Park Lane",
      city: "Leeds",
      county: "West Yorkshire",
      postcode: "LS1 4AB",
      country: "UK",
      latitude: 53.8008,
      longitude: -1.5491,
      sessions: {
        create: [
          {
            title: "Holiday Sports Camp",
            description:
              "A half-day sports camp with games and team play sessions.",
            startsAt: daysFromNow(10, 10, 0),
            endsAt: addHours(daysFromNow(10, 10, 0), 3),
            capacity: 16,
            pricePence: 1800,
            memberPricePence: 1400,
            minAge: 6,
            maxAge: 14,
            isActive: true,
          },
          {
            title: "Football Skills",
            description: "Weekly football skills and confidence building.",
            startsAt: daysFromNow(12, 9, 0),
            endsAt: addHours(daysFromNow(12, 9, 0), 1),
            capacity: 12,
            pricePence: 1100,
            memberPricePence: 800,
            minAge: 5,
            maxAge: 11,
            isActive: true,
          },
        ],
      },
    },
    include: {
      sessions: true,
    },
  });

  const inactiveVenue = await prisma.venue.create({
    data: {
      name: "Fitnest Rotherham Old Venue",
      addressLine1: "9 Closed Road",
      city: "Rotherham",
      county: "South Yorkshire",
      postcode: "S60 1ZZ",
      country: "UK",
      isActive: false,
      sessions: {
        create: [
          {
            title: "Inactive Test Session",
            description: "This session is linked to an inactive venue.",
            startsAt: daysFromNow(14, 12, 0),
            endsAt: addHours(daysFromNow(14, 12, 0), 1),
            capacity: 10,
            pricePence: 1000,
            memberPricePence: null,
            minAge: 4,
            maxAge: 10,
            isActive: false,
          },
        ],
      },
    },
    include: {
      sessions: true,
    },
  });

  const allSessions = [
    ...doncasterVenue.sessions,
    ...sheffieldVenue.sessions,
    ...leedsVenue.sessions,
    ...inactiveVenue.sessions,
  ];

  const bookings = [];

  /*
    Booking 1:
    Active member account booking.
    Sarah receives member pricing: 2 children x £7 = £14.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(1),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: doncasterVenue.sessions[0].id,
        parentUserId: sarahParent.id,
        parentName: sarahParent.name,
        parentEmail: sarahParent.email,
        parentPhone: sarahParent.phone,
        emergencyContactName: sarahParent.defaultEmergencyContactName,
        emergencyContactPhone: sarahParent.defaultEmergencyContactPhone,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        refundStatus: "NONE",
        pricingType: "MEMBER",
        unitPricePence: 700,
        totalAmountPence: 1400,
        childCount: 2,
        stripeCheckoutSessionId: "cs_test_member_confirmed_001",
        stripePaymentIntentId: "pi_test_member_confirmed_001",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: false,
        children: {
          create: [
            {
              parentChildId: sarahOliver.id,
              firstName: sarahOliver.firstName,
              lastName: sarahOliver.lastName,
              dateOfBirth: sarahOliver.dateOfBirth,
              allergies: sarahOliver.allergies,
              medicalNotes: sarahOliver.medicalNotes,
            },
            {
              parentChildId: sarahAmelia.id,
              firstName: sarahAmelia.firstName,
              lastName: sarahAmelia.lastName,
              dateOfBirth: sarahAmelia.dateOfBirth,
              allergies: sarahAmelia.allergies,
              medicalNotes: sarahAmelia.medicalNotes,
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 2:
    Logged-in parent without a membership.
    Michael pays standard pricing: 1 child x £12 = £12.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(2),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: doncasterVenue.sessions[1].id,
        parentUserId: michaelParent.id,
        parentName: michaelParent.name,
        parentEmail: michaelParent.email,
        parentPhone: michaelParent.phone,
        emergencyContactName: michaelParent.defaultEmergencyContactName,
        emergencyContactPhone: michaelParent.defaultEmergencyContactPhone,
        status: "PENDING",
        paymentStatus: "PENDING",
        refundStatus: "NONE",
        pricingType: "STANDARD",
        unitPricePence: 1200,
        totalAmountPence: 1200,
        childCount: 1,
        stripeCheckoutSessionId: "cs_test_pending_002",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: true,
        children: {
          create: [
            {
              parentChildId: michaelNoah.id,
              firstName: michaelNoah.firstName,
              lastName: michaelNoah.lastName,
              dateOfBirth: michaelNoah.dateOfBirth,
              allergies: michaelNoah.allergies,
              medicalNotes: michaelNoah.medicalNotes,
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 3:
    Existing guest-style refunded booking.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(3),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: sheffieldVenue.sessions[0].id,
        parentName: "Emma Wilson",
        parentEmail: "emma@example.com",
        parentPhone: "07888888888",
        emergencyContactName: "Daniel Wilson",
        emergencyContactPhone: "07777777777",
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
        refundStatus: "REFUNDED",
        pricingType: "STANDARD",
        unitPricePence: 1000,
        totalAmountPence: 1000,
        childCount: 1,
        stripeCheckoutSessionId: "cs_test_refunded_003",
        stripePaymentIntentId: "pi_test_refunded_003",
        stripeRefundId: "re_test_refunded_003",
        cancelledAt: new Date(),
        cancellationReason:
          "Bookings and cancellations close at 6pm the day before the session.",
        refundedAt: new Date(),
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: false,
        children: {
          create: [
            {
              firstName: "Harry",
              lastName: "Wilson",
              dateOfBirth: childDob(9),
              allergies: "None",
              medicalNotes: "None",
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 4:
    Member who has scheduled cancellation but remains active until period end.
    Aman still receives member pricing: 4 children x £7 = £28.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(4),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: sheffieldVenue.sessions[1].id,
        parentUserId: amanParent.id,
        parentName: amanParent.name,
        parentEmail: amanParent.email,
        parentPhone: amanParent.phone,
        emergencyContactName: amanParent.defaultEmergencyContactName,
        emergencyContactPhone: amanParent.defaultEmergencyContactPhone,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        refundStatus: "NONE",
        pricingType: "MEMBER",
        unitPricePence: 700,
        totalAmountPence: 2800,
        childCount: 4,
        stripeCheckoutSessionId: "cs_test_member_confirmed_004",
        stripePaymentIntentId: "pi_test_member_confirmed_004",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: true,
        children: {
          create: [
            {
              parentChildId: amanMark.id,
              firstName: amanMark.firstName,
              lastName: amanMark.lastName,
              dateOfBirth: amanMark.dateOfBirth,
              allergies: amanMark.allergies,
              medicalNotes: amanMark.medicalNotes,
            },
            {
              parentChildId: amanCharles.id,
              firstName: amanCharles.firstName,
              lastName: amanCharles.lastName,
              dateOfBirth: amanCharles.dateOfBirth,
              allergies: amanCharles.allergies,
              medicalNotes: amanCharles.medicalNotes,
            },
            {
              parentChildId: amanSofia.id,
              firstName: amanSofia.firstName,
              lastName: amanSofia.lastName,
              dateOfBirth: amanSofia.dateOfBirth,
              allergies: amanSofia.allergies,
              medicalNotes: amanSofia.medicalNotes,
            },
            {
              parentChildId: amanAdam.id,
              firstName: amanAdam.firstName,
              lastName: amanAdam.lastName,
              dateOfBirth: amanAdam.dateOfBirth,
              allergies: amanAdam.allergies,
              medicalNotes: amanAdam.medicalNotes,
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 5:
    Standard guest booking.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(5),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: sheffieldVenue.sessions[1].id,
        parentName: "Priya Patel",
        parentEmail: "priya@example.com",
        parentPhone: "07700123456",
        emergencyContactName: "Ravi Patel",
        emergencyContactPhone: "07700987654",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        refundStatus: "NONE",
        pricingType: "STANDARD",
        unitPricePence: 1000,
        totalAmountPence: 3000,
        childCount: 3,
        stripeCheckoutSessionId: "cs_test_confirmed_005",
        stripePaymentIntentId: "pi_test_confirmed_005",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: false,
        children: {
          create: [
            {
              firstName: "Maya",
              lastName: "Patel",
              dateOfBirth: childDob(4),
              allergies: "None",
              medicalNotes: "None",
            },
            {
              firstName: "Arjun",
              lastName: "Patel",
              dateOfBirth: childDob(5),
              allergies: "None",
              medicalNotes: "Mild asthma.",
            },
            {
              firstName: "Nina",
              lastName: "Patel",
              dateOfBirth: childDob(7),
              allergies: "Egg allergy",
              medicalNotes: "None",
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 6:
    Standard guest booking.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(6),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: sheffieldVenue.sessions[1].id,
        parentName: "Chris Green",
        parentEmail: "chris@example.com",
        parentPhone: "07555111222",
        emergencyContactName: "Chris Green",
        emergencyContactPhone: "07555111222",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        refundStatus: "NONE",
        pricingType: "STANDARD",
        unitPricePence: 1000,
        totalAmountPence: 2000,
        childCount: 2,
        stripeCheckoutSessionId: "cs_test_confirmed_006",
        stripePaymentIntentId: "pi_test_confirmed_006",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: true,
        children: {
          create: [
            {
              firstName: "Leo",
              lastName: "Green",
              dateOfBirth: childDob(3),
              allergies: "None",
              medicalNotes: "None",
            },
            {
              firstName: "Ella",
              lastName: "Green",
              dateOfBirth: childDob(3),
              allergies: "None",
              medicalNotes: "None",
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 7:
    Parent has a PAST_DUE membership.
    Member pricing is unavailable, so standard pricing is used.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(7),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: sheffieldVenue.sessions[2].id,
        parentUserId: rachelParent.id,
        parentName: rachelParent.name,
        parentEmail: rachelParent.email,
        parentPhone: rachelParent.phone,
        emergencyContactName: rachelParent.defaultEmergencyContactName,
        emergencyContactPhone: rachelParent.defaultEmergencyContactPhone,
        status: "PENDING",
        paymentStatus: "FAILED",
        refundStatus: "NONE",
        pricingType: "STANDARD",
        unitPricePence: 1000,
        totalAmountPence: 1000,
        childCount: 1,
        stripeCheckoutSessionId: "cs_test_failed_007",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: false,
        children: {
          create: [
            {
              parentChildId: rachelFreddie.id,
              firstName: rachelFreddie.firstName,
              lastName: rachelFreddie.lastName,
              dateOfBirth: rachelFreddie.dateOfBirth,
              allergies: rachelFreddie.allergies,
              medicalNotes: rachelFreddie.medicalNotes,
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 8:
    Standard guest booking for a higher priced camp.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(8),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: leedsVenue.sessions[0].id,
        parentName: "Hannah Clarke",
        parentEmail: "hannah@example.com",
        parentPhone: "07111222333",
        emergencyContactName: "Ben Clarke",
        emergencyContactPhone: "07111444555",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        refundStatus: "NONE",
        pricingType: "STANDARD",
        unitPricePence: 1800,
        totalAmountPence: 3600,
        childCount: 2,
        stripeCheckoutSessionId: "cs_test_confirmed_008",
        stripePaymentIntentId: "pi_test_confirmed_008",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: true,
        children: {
          create: [
            {
              firstName: "Grace",
              lastName: "Clarke",
              dateOfBirth: childDob(10),
              allergies: "None",
              medicalNotes: "Recently recovered from ankle sprain.",
            },
            {
              firstName: "Jack",
              lastName: "Clarke",
              dateOfBirth: childDob(8),
              allergies: "Hay fever",
              medicalNotes: "None",
            },
          ],
        },
      },
    }),
  );

  /*
    Booking 9:
    Standard guest booking.
  */
  bookings.push(
    await prisma.booking.create({
      data: {
        bookingReference: createBookingReference(9),
        bookingAccessToken: generateBookingAccessToken(),
        sessionId: leedsVenue.sessions[1].id,
        parentName: "David Morgan",
        parentEmail: "david@example.com",
        parentPhone: "07999111222",
        emergencyContactName: "Lucy Morgan",
        emergencyContactPhone: "07999333444",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        refundStatus: "NONE",
        pricingType: "STANDARD",
        unitPricePence: 1100,
        totalAmountPence: 1100,
        childCount: 1,
        stripeCheckoutSessionId: "cs_test_confirmed_009",
        stripePaymentIntentId: "pi_test_confirmed_009",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentTextVersion: "v1",
        marketingOptIn: false,
        children: {
          create: [
            {
              firstName: "Ethan",
              lastName: "Morgan",
              dateOfBirth: childDob(6),
              allergies: "None",
              medicalNotes: "None",
            },
          ],
        },
      },
    }),
  );

  console.log("Seed complete.");

  console.log({
    admin: {
      email: adminUser.email,
      password: adminPassword,
    },
    parentAccounts: [
      {
        email: sarahParent.email,
        password: parentPassword,
        membership: sarahParent.membership?.status,
        example: "Active member with member-priced booking",
      },
      {
        email: michaelParent.email,
        password: parentPassword,
        membership: "NO MEMBERSHIP",
        example: "Account customer paying standard pricing",
      },
      {
        email: amanParent.email,
        password: parentPassword,
        membership: amanParent.membership?.status,
        cancelAtPeriodEnd: amanParent.membership?.cancelAtPeriodEnd,
        example: "Member cancelled renewal but still receives benefits",
      },
      {
        email: rachelParent.email,
        password: parentPassword,
        membership: rachelParent.membership?.status,
        example: "Past-due member who no longer receives discount",
      },
      {
        email: cancelledMembershipParent.email,
        password: parentPassword,
        membership: cancelledMembershipParent.membership?.status,
        example: "Cancelled membership account",
      },
    ],
    venueInterests: venueInterests.count,
    venues: [
      doncasterVenue.name,
      sheffieldVenue.name,
      leedsVenue.name,
      inactiveVenue.name,
    ],
    sessions: allSessions.map((session) => ({
      title: session.title,
      startsAt: session.startsAt,
      standardPricePence: session.pricePence,
      memberPricePence: session.memberPricePence,
      active: session.isActive,
    })),
    bookings: bookings.map((booking) => ({
      reference: booking.bookingReference,
      email: booking.parentEmail,
      pricingType: booking.pricingType,
      unitPricePence: booking.unitPricePence,
      totalAmountPence: booking.totalAmountPence,
      accessUrl: `/booking/${booking.bookingReference}?token=${booking.bookingAccessToken}`,
    })),
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
