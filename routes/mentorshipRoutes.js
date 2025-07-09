const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const multer = require('multer');

// Configure multer for file uploads (memory storage for base64 conversion)
const upload = multer({ storage: multer.memoryStorage() });
/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Introduction to Trading"
 *         modules:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         isPublished:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Module:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Basics of Stock Trading"
 *         description:
 *           type: string
 *           example: "Learn the fundamentals..."
 *         courseId:
 *           type: string
 *           format: uuid
 *         lessons:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         assessments:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Lesson:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Understanding Stocks"
 *         description:
 *           type: string
 *           example: "Overview of stock markets..."
 *         url:
 *           type: string
 *           example: "https://example.com/video.mp4"
 *         duration:
 *           type: number
 *           example: 30
 *         moduleId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Assessment:
 *       type: object
 *       properties:
 *         moduleId:
 *           type: string
 *           format: uuid
 *         questions:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         isPublished:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Question:
 *       type: object
 *       properties:
 *         assessmentId:
 *           type: string
 *           format: uuid
 *         text:
 *           type: string
 *           example: "What is a stock?"
 *         trueOption:
 *           type: string
 *           example: "A share in a company"
 *         falseOptions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["A bond", "A currency", "A loan"]
 *         photo:
 *           type: string
 *           example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * /api/mentorship/courses:
 *   get:
 *     summary: Get all courses
 *     description: Retrieves a list of all courses.
 *     tags: [Mentorship API]
 *     responses:
 *       '200':
 *         description: List of courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve courses"
 */
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('modules');
    res.json({ courses });
  } catch (error) {
    console.error('Course Error:', error);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

/**
 * @swagger
 * /api/mentorship/courses:
 *   post:
 *     summary: Create a new course
 *     description: Creates a new course with an optional initial module.
 *     tags: [Mentorship API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to Trading"
 *     responses:
 *       '201':
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course created successfully"
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Title is required"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create course"
 */
router.post('/courses', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const course = new Course({ title });
    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error('Course Error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * @swagger
 * /api/mentorship/courses/{id}:
 *   put:
 *     summary: Edit a course
 *     description: Updates the title of an existing course.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced Trading Techniques"
 *     responses:
 *       '200':
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course updated successfully"
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       '404':
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Course not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update course"
 */
router.put('/courses/:id', async (req, res) => {
  const { title } = req.body;

  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { title }, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Course Error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * @swagger
 * /api/mentorship/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     description: Deletes a course and its associated modules, lessons, and assessments.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c5"
 *     responses:
 *       '200':
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course deleted successfully"
 *       '404':
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Course not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete course"
 */
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    await Module.deleteMany({ courseId: req.params.id });
    await Lesson.deleteMany({ moduleId: { $in: course.modules } });
    await Assessment.deleteMany({ moduleId: { $in: course.modules } });
    await Question.deleteMany({ assessmentId: { $in: await Assessment.find({ moduleId: { $in: course.modules } }).distinct('_id') } });
    await course.remove();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Course Error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * @swagger
 * /api/mentorship/courses/{id}/publish:
 *   post:
 *     summary: Publish a course
 *     description: Publishes a course if it has at least one module.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c5"
 *     responses:
 *       '200':
 *         description: Course published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course published successfully"
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       '400':
 *         description: Course must have at least one module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Course must have at least one module"
 *       '404':
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Course not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to publish course"
 */
router.post('/courses/:id/publish', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('modules');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (course.modules.length === 0) {
      return res.status(400).json({ error: 'Course must have at least one module' });
    }
    course.isPublished = true;
    await course.save();
    res.json({ message: 'Course published successfully', course });
  } catch (error) {
    console.error('Course Error:', error);
    res.status(500).json({ error: 'Failed to publish course' });
  }
});

/**
 * @swagger
 * /api/mentorship/courses/{courseId}/modules:
 *   post:
 *     summary: Create a new module
 *     description: Creates a new module for a specific course.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: courseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Basics of Stock Trading"
 *               description:
 *                 type: string
 *                 example: "Learn the fundamentals..."
 *     responses:
 *       '201':
 *         description: Module created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module created successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "All fields are required"
 *       '404':
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Course not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create module"
 */
router.post('/courses/:courseId/modules', async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const module = new Module({ title, description, courseId: req.params.courseId });
    await module.save();
    course.modules.push(module._id);
    await course.save();
    res.status(201).json({ message: 'Module created successfully', module });
  } catch (error) {
    console.error('Module Error:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

/**
 * @swagger
 * /api/mentorship/modules/{id}:
 *   put:
 *     summary: Edit a module
 *     description: Updates the title and description of an existing module.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced Stock Trading"
 *               description:
 *                 type: string
 *                 example: "Advanced techniques..."
 *     responses:
 *       '200':
 *         description: Module updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module updated successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
 *       '404':
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Module not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update module"
 */
router.put('/modules/:id', async (req, res) => {
  const { title, description } = req.body;

  try {
    const module = await Module.findByIdAndUpdate(req.params.id, { title, description }, { new: true, runValidators: true });
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json({ message: 'Module updated successfully', module });
  } catch (error) {
    console.error('Module Error:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

/**
 * @swagger
 * /api/mentorship/modules/{id}:
 *   delete:
 *     summary: Delete a module
 *     description: Deletes a module and its associated lessons and assessments.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c6"
 *     responses:
 *       '200':
 *         description: Module deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module deleted successfully"
 *       '404':
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Module not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete module"
 */
router.delete('/modules/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    await Lesson.deleteMany({ moduleId: req.params.id });
    await Assessment.deleteMany({ moduleId: req.params.id });
    await Question.deleteMany({ assessmentId: { $in: await Assessment.find({ moduleId: req.params.id }).distinct('_id') } });
    await Course.updateOne({ modules: module._id }, { $pull: { modules: module._id } });
    await module.remove();
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Module Error:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

/**
 * @swagger
 * /api/mentorship/modules/{moduleId}/lessons:
 *   post:
 *     summary: Create a new lesson
 *     description: Creates a new lesson for a specific module.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: moduleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Understanding Stocks"
 *               description:
 *                 type: string
 *                 example: "Overview of stock markets..."
 *               url:
 *                 type: string
 *                 example: "https://example.com/video.mp4"
 *               duration:
 *                 type: number
 *                 example: 30
 *     responses:
 *       '201':
 *         description: Lesson created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lesson created successfully"
 *                 lesson:
 *                   $ref: '#/components/schemas/Lesson'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "All fields are required"
 *       '404':
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Module not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create lesson"
 */
router.post('/modules/:moduleId/lessons', async (req, res) => {
  const { title, description, url, duration } = req.body;

  if (!title || !description || !url || !duration) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    const lesson = new Lesson({ title, description, url, duration, moduleId: req.params.moduleId });
    await lesson.save();
    module.lessons.push(lesson._id);
    await module.save();
    res.status(201).json({ message: 'Lesson created successfully', lesson });
  } catch (error) {
    console.error('Lesson Error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

/**
 * @swagger
 * /api/mentorship/modules/{moduleId}/assessments:
 *   post:
 *     summary: Create a new assessment
 *     description: Creates a new assessment for a specific module.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: moduleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c6"
 *     responses:
 *       '201':
 *         description: Assessment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Assessment created successfully"
 *                 assessment:
 *                   $ref: '#/components/schemas/Assessment'
 *       '404':
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Module not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create assessment"
 */
router.post('/modules/:moduleId/assessments', async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    const assessment = new Assessment({ moduleId: req.params.moduleId });
    await assessment.save();
    module.assessments.push(assessment._id);
    await module.save();
    res.status(201).json({ message: 'Assessment created successfully', assessment });
  } catch (error) {
    console.error('Assessment Error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

/**
 * @swagger
 * /api/mentorship/assessments/{assessmentId}/publish:
 *   post:
 *     summary: Publish an assessment
 *     description: Publishes an assessment if it has at least one question.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: assessmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c7"
 *     responses:
 *       '200':
 *         description: Assessment published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Assessment published successfully"
 *                 assessment:
 *                   $ref: '#/components/schemas/Assessment'
 *       '400':
 *         description: Assessment must have at least one question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Assessment must have at least one question"
 *       '404':
 *         description: Assessment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Assessment not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to publish assessment"
 */
router.post('/assessments/:assessmentId/publish', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId).populate('questions');
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    if (assessment.questions.length === 0) {
      return res.status(400).json({ error: 'Assessment must have at least one question' });
    }
    assessment.isPublished = true;
    await assessment.save();
    res.json({ message: 'Assessment published successfully', assessment });
  } catch (error) {
    console.error('Assessment Error:', error);
    res.status(500).json({ error: 'Failed to publish assessment' });
  }
});

/**
 * @swagger
 * /api/mentorship/assessments/{assessmentId}/questions:
 *   post:
 *     summary: Create a new question
 *     description: Creates a new question for a specific assessment with an optional photo upload.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: assessmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c7"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "What is a stock?"
 *               trueOption:
 *                 type: string
 *                 example: "A share in a company"
 *               falseOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A bond", "A currency", "A loan"]
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Uploaded photo file
 *     responses:
 *       '201':
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question created successfully"
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "All fields are required, falseOptions must have at least 2 options"
 *       '404':
 *         description: Assessment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Assessment not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create question"
 */
router.post('/assessments/:assessmentId/questions', upload.single('photo'),  async (req, res) => {
  const { text, trueOption, falseOptions } = req.body;
  let photo = '';

  if (req.file) {
    const mimeType = req.file.mimetype; // e.g., 'image/jpeg'
    const base64Data = req.file.buffer.toString('base64');
    photo = `data:${mimeType};base64,${base64Data}`;
  }

  if (!text || !trueOption || !falseOptions || falseOptions.length < 2) {
    return res.status(400).json({ error: 'All fields are required, falseOptions must have at least 2 options' });
  }

  try {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const question = new Question({ assessmentId: req.params.assessmentId, text, trueOption, falseOptions, photo });
    await question.save();
    assessment.questions.push(question._id);
    await assessment.save();
    res.status(201).json({ message: 'Question created successfully', question });
  } catch (error) {
    console.error('Question Error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

/**
 * @swagger
 * /api/mentorship/questions/{id}:
 *   put:
 *     summary: Edit a question
 *     description: Updates the details of an existing question with an optional photo upload.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c8"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "What is a stock?"
 *               trueOption:
 *                 type: string
 *                 example: "A share in a company"
 *               falseOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A bond", "A currency", "A loan"]
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Uploaded photo file
 *     responses:
 *       '200':
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question updated successfully"
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       '404':
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Question not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update question"
 */
router.put('/questions/:id', upload.single('photo'), async (req, res) => {
  const { text, trueOption, falseOptions } = req.body;
  let photo = '';

  if (req.file) {
    const mimeType = req.file.mimetype; // e.g., 'image/jpeg'
    const base64Data = req.file.buffer.toString('base64');
    photo = `data:${mimeType};base64,${base64Data}`;
  }

  if (!text || !trueOption || !falseOptions || falseOptions.length < 2) {
    return res.status(400).json({ error: 'All fields are required, falseOptions must have at least 2 options' });
  }

  try {
    const question = await Question.findByIdAndUpdate(req.params.id, { text, trueOption, falseOptions, photo }, { new: true, runValidators: true });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question updated successfully', question });
  } catch (error) {
    console.error('Question Error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

/**
 * @swagger
 * /api/mentorship/questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     description: Deletes a specific question from an assessment.
 *     tags: [Mentorship API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f9e8b7c9d4a1f2e3b4c8"
 *     responses:
 *       '200':
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question deleted successfully"
 *       '404':
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Question not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete question"
 */
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    await Assessment.updateOne({ questions: question._id }, { $pull: { questions: question._id } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Question Error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;