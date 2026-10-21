const { os, ORPCError } = require('@orpc/server');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const taskService = require('../services/taskService');

const JWT_SECRET = process.env.JWT_SECRET || 'taskstreak-secret-jwt-key-2026';

const authedProcedure = os.use(async ({ context, next }) => {
  let userId = context && context.userId;
  let user = null;

  if (userId) {
    user = await taskService.getUserById(userId);
  }

  if (!user) {
    user = await taskService.getSingleUser();
  }

  return next({
    context: {
      ...context,
      user,
      userId: (user._id || user.id).toString(),
    },
  });
});

const publicProcedure = os;

const appRouter = {
  auth: {
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6, 'Password must be at least 6 characters'),
          timezone: z.string().optional(),
        })
      )
      .handler(async ({ input }) => {
        try {
          const user = await taskService.registerUser(input);
          const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
          );
          return { token, user };
        } catch (err) {
          throw new ORPCError('BAD_REQUEST', { message: err.message });
        }
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().min(1, 'Username or email required'),
          password: z.string(),
        })
      )
      .handler(async ({ input }) => {
        try {
          const user = await taskService.loginUser(input);
          const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
          );
          return { token, user };
        } catch (err) {
          throw new ORPCError('UNAUTHORIZED', { message: err.message });
        }
      }),

    me: authedProcedure
      .input(z.object({}).optional())
      .handler(async ({ context }) => {
        return { user: context.user };
      }),
  },

  tasks: {
    list: authedProcedure
      .input(z.object({}).optional())
      .handler(async ({ context }) => {
        return await taskService.getTasksForUser(context.userId);
      }),

    create: authedProcedure
      .input(
        z.object({
          title: z.string().min(1, 'Task title is required'),
        })
      )
      .handler(async ({ input, context }) => {
        const task = await taskService.createTaskForUser(context.userId, input.title);
        return { task };
      }),

    update: authedProcedure
      .input(
        z.object({
          taskId: z.string(),
          title: z.string().min(1, 'Task title is required'),
        })
      )
      .handler(async ({ input, context }) => {
        const task = await taskService.updateTaskForUser(context.userId, input.taskId, input.title);
        return { task };
      }),

    delete: authedProcedure
      .input(
        z.object({
          taskId: z.string(),
        })
      )
      .handler(async ({ input, context }) => {
        return await taskService.deleteTaskForUser(context.userId, input.taskId);
      }),

    log: authedProcedure
      .input(
        z.object({
          taskId: z.string(),
          simulatedNowUtc: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        try {
          return await taskService.logTaskCompletion(
            context.userId,
            input.taskId,
            input.simulatedNowUtc
          );
        } catch (err) {
          throw new ORPCError('BAD_REQUEST', {
            message: err.message,
            data: err.details,
          });
        }
      }),

    logs: authedProcedure
      .input(
        z.object({
          taskId: z.string(),
        })
      )
      .handler(async ({ input }) => {
        const logs = await taskService.getTaskLogs(input.taskId);
        return { logs };
      }),
  },

  user: {
    get: authedProcedure
      .input(z.object({}).optional())
      .handler(async ({ context }) => {
        return { user: context.user };
      }),

    update: authedProcedure
      .input(
        z.object({
          timezone: z.string().optional(),
          expo_push_token: z.string().nullable().optional(),
          notification: z.enum(['enabled', 'disabled']).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const updatedUser = await taskService.updateUser(context.userId, input);
        return { user: updatedUser };
      }),
  },

  reminders: {
    test: publicProcedure
      .input(z.object({}).optional())
      .handler(async () => {
        const { checkAndSendReminders } = require('../services/notifier');
        await checkAndSendReminders();
        return { success: true, message: 'Checked reminders for 8:00 PM local users' };
      }),
  },
};

module.exports = {
  appRouter,
  JWT_SECRET,
};
