import mongoose from 'mongoose';
const { Schema } = mongoose;

const ExecutionSchema = new Schema({
  job:             { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  workspace:       { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  status:          { type: String, enum: ['running', 'success', 'failed', 'timeout'] },
  attempt:         { type: Number, default: 1 },
  triggeredBy:     { type: String, enum: ['schedule', 'manual', 'api'] },
  executedAt:      { type: Date, default: Date.now },
  completedAt:     { type: Date, default: null },
  durationMs:      { type: Number, default: null },
  statusCode:      { type: Number, default: null },
  errorDetails:    { type: String, default: '' },
  responsePayload: { type: String, default: '' },
  responseStatus:  { type: Number, default: null },
  responseSnippet: { type: String, default: '' },
  errorMessage:    { type: String, default: '' },
});

// Fast per-job queries (execution history page)
ExecutionSchema.index({ job: 1, executedAt: -1 });
// Fast workspace-wide queries (dashboard feed)
ExecutionSchema.index({ workspace: 1, executedAt: -1 });

export default mongoose.model('Execution', ExecutionSchema);
