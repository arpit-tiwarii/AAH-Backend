const { DatabaseError } = require('../Error/DataBaseError');
const {
    findAllAthletes,
    findUserById,
    updateUserById,
    deleteUserById,
} = require('../repositories/User.repository');
const { InternalServerError } = require('../Error/InternalServerError');
const { ValidationError } = require('../Error/ValidationError');
const { Authentication } = require('../Error/AuthenticationError');
const { ALLOWED_SPORTS, ATHLETE_STATUS } = require('../utils/constants');
const { sendApprovalConfirmedEmail, sendApprovalRejectedEmail } = require('../utils/email.service');
const { logger } = require('../utils/logger');


const getAllAthletesService = async () => {
    try {
        const athletes = await findAllAthletes();
        // Always return an array so callers (and the frontend) can safely map
        // over the result even when no athletes exist yet.
        return athletes || [];
    } catch (error) {
        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

const getAthleteByIdService = async (id) => {
    try {
        const athlete = await findUserById(id);
        const role = String(athlete?.role || '').toUpperCase();
        if (!athlete || role !== 'ATHLETE') {
            throw new ValidationError('Athlete not found');
        }
        return athlete;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

const updateAthleteService = async (id, { name, age, sports, contact, school, afiId }) => {
    try {
        const athlete = await findUserById(id);
        const role = String(athlete?.role || '').toUpperCase();
        if (!athlete || role !== 'ATHLETE') {
            throw new ValidationError('Athlete not found');
        }

        const updates = {};
        if (name) updates.name = name;
        if (age) updates.age = age;
        if (contact) updates.contact = contact;
        if (school) updates.school = school;
        if (afiId) updates.afiId = afiId;

        if (sports) {
            let sportValue = sports;
            if (Array.isArray(sportValue)) sportValue = sportValue[0];
            if (typeof sportValue === 'string' && sportValue.includes(',')) {
                sportValue = sportValue.split(',')[0];
            }
            sportValue = String(sportValue).trim();

            if (!ALLOWED_SPORTS.includes(sportValue)) {
                throw new ValidationError('Invalid sport value');
            }
            updates.sports = sportValue;
        }

        const updatedAthlete = await updateUserById(id, updates);
        if (!updatedAthlete) {
            throw new DatabaseError('Failed to update athlete');
        }
        return updatedAthlete;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

const deleteAthleteService = async (id) => {
    try {
        const deleted = await deleteUserById(id);
        if (!deleted) {
            throw new ValidationError('Athlete not found');
        }
        return { message: 'Athlete removed successfully' };
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

const updateAthleteStatusService = async (id, { status, reason }) => {
    try {
        const validStatuses = [ATHLETE_STATUS.PENDING, ATHLETE_STATUS.APPROVED, ATHLETE_STATUS.REJECTED];
        if (!validStatuses.includes(status)) {
            throw new ValidationError('Invalid status');
        }

        const athlete = await findUserById(id);
        const role = String(athlete?.role || '').toUpperCase();
        if (!athlete || role !== 'ATHLETE') {
            throw new Authentication('Athlete not found');
        }

        const updatedAthlete = await updateUserById(id, { status });

        // Notify the athlete best-effort: an SMTP outage must never fail an
        // admin's approve/reject action.
        try {
            if (status === ATHLETE_STATUS.APPROVED) {
                await sendApprovalConfirmedEmail({
                    email: athlete.email,
                    name: athlete.name,
                    role,
                });
            } else if (status === ATHLETE_STATUS.REJECTED) {
                await sendApprovalRejectedEmail({
                    email: athlete.email,
                    name: athlete.name,
                    role,
                    reason: reason || 'Your submitted documentation could not be verified.',
                });
            }
        } catch (emailError) {
            logger.error({ err: emailError?.message, athleteId: id, status }, 'Failed to send approval email');
        }

        return {
            id: updatedAthlete.id,
            name: updatedAthlete.name,
            status: updatedAthlete.status,
        };
    } catch (error) {
        if (error instanceof ValidationError || error instanceof Authentication) throw error;
        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

module.exports = {
    getAllAthletesService,
    getAthleteByIdService,
    updateAthleteService,
    updateAthleteStatusService,
    deleteAthleteService,
}
