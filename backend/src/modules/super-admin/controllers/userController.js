
const User = require("../../../models/User");
const { getAuth } = require("firebase-admin/auth");

// ==========================================
// GET PLATFORM USERS
// ==========================================

async function getPlatformUsers(req, res, next) {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const search = String(req.query.search || "")
      .trim()
      .slice(0, 100);

    const filter = {
      role: "SUPER_ADMIN",
      tenantId: null
    };

    if (search) {
      const escaped = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { name: regex },
        { email: regex }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "name email role status lastLoginAt createdAt"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter)
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// CREATE PLATFORM USER
// ==========================================

async function createPlatformUser(req, res, next) {
  let createdFirebaseUid = null;
  let mongoUserCreated = false;

  try {
    const name = String(req.body?.name || "").trim();

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const mobileNumber = String(
      req.body?.mobileNumber || ""
    ).trim();

    // Validate submitted information.
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required."
      });
    }

    if (
      name.length > 100 ||
      mobileNumber.length > 20 ||
      !/^\S+@\S+\.\S+$/.test(email)
    ) {
      return res.status(400).json({
        message: "Please provide valid user details."
      });
    }

    // Check whether the email already exists in MongoDB.
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists."
      });
    }

    const auth = getAuth();

    // Check whether the email already exists in Firebase.
    try {
      await auth.getUserByEmail(email);

      return res.status(409).json({
        message: "This email already has a Firebase account."
      });
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create a disabled Firebase identity.
    // Activation and password setup must be handled separately.
    const firebaseUser = await auth.createUser({
      email,
      displayName: name,
      disabled: true
    });

    createdFirebaseUid = firebaseUser.uid;

    // Save the matching MongoDB user.
    const user = await User.create({
      firebaseUid: firebaseUser.uid,
      name,
      email,
      mobileNumber,
      role: "SUPER_ADMIN",
      tenantId: null,
      status: "Inactive"
    });

    mongoUserCreated = true;

    return res.status(201).json({
      message:
        "Super Admin user created. Account activation is pending.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    // Clean up the Firebase identity if MongoDB creation failed.
    if (createdFirebaseUid && !mongoUserCreated) {
      try {
        await getAuth().deleteUser(createdFirebaseUid);
      } catch (cleanupError) {
        console.error(
          "Firebase cleanup failed:",
          cleanupError.message
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A user with this email or Firebase UID already exists."
      });
    }

    next(error);
  }
}

module.exports = {
  getPlatformUsers,
  createPlatformUser
};
