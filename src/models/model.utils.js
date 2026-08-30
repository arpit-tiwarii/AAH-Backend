const mongoose = require('mongoose');

function normalizeRole(value) {
    if (value == null) return value;
    return String(value).toUpperCase();
}

function normalizeStatus(value) {
    if (value == null) return value;
    const normalized = String(value).toUpperCase();
    if (normalized === 'REJECT') return 'REJECTED';
    return normalized;
}

function baseSchemaOptions() {
    return {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (_, ret) => {
                if ('role' in ret) ret.role = normalizeRole(ret.role);
                if ('status' in ret) ret.status = normalizeStatus(ret.status);
                ret.id = ret._id?.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            versionKey: false,
            transform: (_, ret) => {
                if ('role' in ret) ret.role = normalizeRole(ret.role);
                if ('status' in ret) ret.status = normalizeStatus(ret.status);
                ret.id = ret._id?.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    };
}

function withSoftDelete(schema) {
    schema.add({
        deletedAt: {
            type: Date,
            default: null,
        }
    });

    const queryMiddleware = function () {
        if (!this.getFilter().includeDeleted) {
            this.where({ deletedAt: null });
        }
        const filter = { ...this.getFilter() };
        delete filter.includeDeleted;
        this.setQuery(filter);
    };

    schema.pre('find', queryMiddleware);
    schema.pre('findOne', queryMiddleware);
    schema.pre('countDocuments', queryMiddleware);

    schema.methods.softDelete = function (options = {}) {
        this.deletedAt = new Date();
        return this.save(options);
    };
}

async function isReplicaSetReady() {
    const admin = mongoose.connection.db?.admin?.();
    if (!admin) return false;

    try {
        const response = await admin.command({ hello: 1 });
        return Boolean(response.setName);
    } catch {
        return false;
    }
}

module.exports = {
    baseSchemaOptions,
    withSoftDelete,
    normalizeRole,
    normalizeStatus,
    isReplicaSetReady,
};
