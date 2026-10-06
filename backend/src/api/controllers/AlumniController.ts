import { Request, Response } from "express";
import { AlumniManager } from "@alumni/businesslogic";
import { AlumniDTO } from "@alumni/dal";
import {
  findWrongType,
  isAdmin,
  isIntegerOrNull,
  isSelf,
  isStringOrNull,
  pickSent,
} from "../utils/requestHelpers";

const alumniManager = new AlumniManager();

// The only fields PUT /api/alumni/:id may change. user_id is not here on purpose.
const UPDATABLE_FIELDS = [
  "department",
  "graduation_year",
  "current_company",
  "job_title",
  "experience",
  "bio",
  "linkedin_url",
] as const;

export const createAlumni = async (req: Request, res: Response) => {
  try {
    const {
      department,
      graduation_year,
      current_company,
      job_title,
      experience,
      bio,
      linkedin_url,
    } = req.body;

    // The profile belongs to the caller; a user_id in the body is ignored.
    const alumni = new AlumniDTO(
      req.user.sub,
      department,
      current_company,
      job_title,
      experience,
      bio,
      linkedin_url,
    );

    
    alumni.graduation_year = graduation_year;

    const newAlumni = await alumniManager.createAlumni(alumni);
    res.status(201).json(newAlumni);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllAlumni = async (req: Request, res: Response) => {
  try {
    const alumni = await alumniManager.getAllAlumni();
    res.status(200).json(alumni);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const findAlumniById = async (req: Request, res: Response) => {
  try {
    const alumni = await alumniManager.findAlumniById(Number(req.params.id));
    res.status(200).json(alumni);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const findAlumniByEmail = async (req: Request, res: Response) => {
  try {
    const email = Array.isArray(req.params.email)
      ? req.params.email[0]
      : req.params.email;
    const alumni = await alumniManager.findAlumniByEmail(email);
    res.status(200).json(alumni);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const updateAlumni = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await alumniManager.findAlumniById(id);
    if (!existing) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }

    // A profile with no user_id has no owner, so only an admin can edit it.
    if (!isSelf(req, existing.user_id) && !isAdmin(req)) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this profile" });
    }

    const fields = pickSent(req.body, UPDATABLE_FIELDS);
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { graduation_year, ...textFields } = fields;
    const wrongType =
      findWrongType(textFields, isStringOrNull) ??
      findWrongType(
        graduation_year === undefined ? {} : { graduation_year },
        isIntegerOrNull,
      );
    if (wrongType) {
      return res.status(400).json({ error: `${wrongType} has the wrong type` });
    }

    const updated = await alumniManager.updateAlumni(
      id,
      fields as Partial<AlumniDTO>,
    );
    if (!updated) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};