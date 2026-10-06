import { Request, Response } from "express";
import {
  AlumniManager,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@alumni/businesslogic";
import { AlumniDTO } from "@alumni/dal";
import {
  checkFields,
  isAdmin,
  isBoolean,
  isIntegerOrNull,
  isSelf,
  isStringOrNull,
  MAX_DB_INTEGER,
  parseId,
  parsePaging,
  pickSent,
  queryText,
} from "../utils/requestHelpers";

// The only fields POST /api/alumni and PUT /api/alumni/:id read from the body.
// user_id is not here on purpose. AlumniQuery keeps its own copy of this list
// (gotcha G30): a field added here must be added there too.
const UPDATABLE_FIELDS = [
  "department",
  "graduation_year",
  "current_company",
  "job_title",
  "experience",
  "bio",
  "linkedin_url",
  "mentorship_available",
  "field",
] as const;

type AlumniField = (typeof UPDATABLE_FIELDS)[number];

// One rule per field, used by create and update alike.
// mentorship_available is NOT NULL in the database, so null is refused.
const FIELD_RULES: Record<AlumniField, (value: unknown) => boolean> = {
  department: isStringOrNull,
  graduation_year: isIntegerOrNull,
  current_company: isStringOrNull,
  job_title: isStringOrNull,
  experience: isStringOrNull,
  bio: isStringOrNull,
  linkedin_url: isStringOrNull,
  mentorship_available: isBoolean,
  field: isStringOrNull,
};

const PROFILE_NOT_FOUND = "Alumni profile not found";
const PROFILE_EXISTS = "You already have an alumni profile";
const NOT_PROFILE_OWNER = "Not authorized to update this profile";
const NO_FIELDS = "No fields to update";
const BAD_GRADUATION_YEAR = "graduation_year must be a whole number";
const BAD_MENTORING = "mentoring must be true";

const MENTORING_ON = "true";
const DIGITS_ONLY = /^\d+$/;

function textOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/** The `graduation_year` filter: absent or blank is no filter. */
function readGraduationYear(
  query: Readonly<Record<string, unknown>>,
): number | undefined {
  const sent = queryText(query, "graduation_year");
  if (sent === undefined) return undefined;

  const year = DIGITS_ONLY.test(sent) ? Number(sent) : NaN;
  if (!Number.isInteger(year) || year > MAX_DB_INTEGER) {
    throw new ValidationError(BAD_GRADUATION_YEAR);
  }
  return year;
}

/** The `mentoring` filter: absent or blank is no filter; only "true" is allowed. */
function readMentoring(
  query: Readonly<Record<string, unknown>>,
): true | undefined {
  const sent = queryText(query, "mentoring");
  if (sent === undefined) return undefined;
  if (sent !== MENTORING_ON) {
    throw new ValidationError(BAD_MENTORING);
  }
  return true;
}

export class AlumniController {
  private readonly alumniManager = new AlumniManager();

  public async createAlumni(req: Request, res: Response) {
    const fields = checkFields(
      pickSent(req.body, UPDATABLE_FIELDS),
      FIELD_RULES,
    );

    // The profile belongs to the caller; a user_id in the body is ignored.
    const alumni = new AlumniDTO(
      req.user.sub,
      textOrNull(fields.department),
      textOrNull(fields.current_company),
      textOrNull(fields.job_title),
      textOrNull(fields.experience),
      textOrNull(fields.bio),
      textOrNull(fields.linkedin_url),
      fields.mentorship_available === true,
      textOrNull(fields.field),
    );
    alumni.graduation_year = numberOrNull(fields.graduation_year);

    // Nothing back means this user already has a profile (ADR-03).
    const newAlumni = await this.alumniManager.createAlumni(alumni);
    if (!newAlumni) {
      throw new ConflictError(PROFILE_EXISTS);
    }
    res.status(201).json(newAlumni);
  }

  public async getAllAlumni(req: Request, res: Response) {
    const { page, limit, offset } = parsePaging(req.query);

    // A filter that was not sent is left out of the object: the Manager reads
    // any key that is present as a filter to apply.
    const filter: Parameters<AlumniManager["listAlumni"]>[0] = {};

    const q = queryText(req.query, "q");
    if (q !== undefined) filter.q = q;

    const department = queryText(req.query, "department");
    if (department !== undefined) filter.department = department;

    const graduationYear = readGraduationYear(req.query);
    if (graduationYear !== undefined) filter.graduation_year = graduationYear;

    const field = queryText(req.query, "field");
    if (field !== undefined) filter.field = field;

    const mentoring = readMentoring(req.query);
    if (mentoring !== undefined) filter.mentoring = mentoring;

    const { rows, total } = await this.alumniManager.listAlumni(filter, {
      limit,
      offset,
    });
    res.status(200).json({ items: rows, total, page, limit });
  }

  public async getAlumniFilters(req: Request, res: Response) {
    const filterValues = await this.alumniManager.getFilterValues();
    res.status(200).json(filterValues);
  }

  public async getMyAlumni(req: Request, res: Response) {
    const alumni = await this.alumniManager.findAlumniByUserId(req.user.sub);
    if (!alumni) {
      throw new NotFoundError(PROFILE_NOT_FOUND);
    }
    res.status(200).json(alumni);
  }

  public async findAlumniById(req: Request, res: Response) {
    const id = parseId(req.params.id);

    const alumni = await this.alumniManager.findAlumniById(id);
    if (!alumni) {
      throw new NotFoundError(PROFILE_NOT_FOUND);
    }
    res.status(200).json(alumni);
  }

  public async findAlumniByEmail(req: Request, res: Response) {
    const email = Array.isArray(req.params.email)
      ? req.params.email[0]
      : req.params.email;

    const alumni = await this.alumniManager.findAlumniByEmail(email);
    if (!alumni) {
      throw new NotFoundError(PROFILE_NOT_FOUND);
    }
    res.status(200).json(alumni);
  }

  public async updateAlumni(req: Request, res: Response) {
    const id = parseId(req.params.id);

    const existing = await this.alumniManager.findAlumniById(id);
    if (!existing) {
      throw new NotFoundError(PROFILE_NOT_FOUND);
    }

    // A profile with no user_id has no owner, so only an admin can edit it.
    if (!isSelf(req, existing.user_id) && !isAdmin(req)) {
      throw new ForbiddenError(NOT_PROFILE_OWNER);
    }

    const sent = pickSent(req.body, UPDATABLE_FIELDS);
    if (Object.keys(sent).length === 0) {
      throw new ValidationError(NO_FIELDS);
    }

    const fields = checkFields(sent, FIELD_RULES);

    const updated = await this.alumniManager.updateAlumni(id, fields);
    if (!updated) {
      throw new NotFoundError(PROFILE_NOT_FOUND);
    }
    res.status(200).json(updated);
  }
}
