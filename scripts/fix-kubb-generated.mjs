import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const indexPath = path.join(root, 'shared', 'gen', 'index.ts')
const blankEnumPath = path.join(root, 'shared', 'gen', 'mocks', 'faker', 'createBlankEnum.ts')

function patchIndex() {
  if (!fs.existsSync(indexPath)) return

  let content = fs.readFileSync(indexPath, 'utf8')

  const replacements = [
    [
      'export { createAppointment } from "./mocks/faker/createAppointment.ts";',
      'export { createAppointment as createAppointmentMock } from "./mocks/faker/createAppointment.ts";',
    ],
    [
      'export { createConvenio } from "./mocks/faker/createConvenio.ts";',
      'export { createConvenio as createConvenioMock } from "./mocks/faker/createConvenio.ts";',
    ],
    [
      'export { createDoctorSchedule } from "./mocks/faker/createDoctorSchedule.ts";',
      'export { createDoctorSchedule as createDoctorScheduleMock } from "./mocks/faker/createDoctorSchedule.ts";',
    ],
    [
      'export { createExamType } from "./mocks/faker/createExamType.ts";',
      'export { createExamType as createExamTypeMock } from "./mocks/faker/createExamType.ts";',
    ],
    [
      'export { createScheduleException } from "./mocks/faker/createScheduleException.ts";',
      'export { createScheduleException as createScheduleExceptionMock } from "./mocks/faker/createScheduleException.ts";',
    ],
  ]

  for (const [from, to] of replacements) {
    content = content.replace(from, to)
  }

  fs.writeFileSync(indexPath, content)
}

function patchBlankEnum() {
  if (!fs.existsSync(blankEnumPath)) return

  let content = fs.readFileSync(blankEnumPath, 'utf8')
  content = content.replace(
    /import \{ faker \} from "@faker-js\/faker";\n\nexport function createBlankEnum\(data\?: Partial<BlankEnum>\): BlankEnum \{\n\n  return data \|\| faker.helpers.arrayElement<BlankEnum>\(\[""\]\)\n\}/m,
    'export function createBlankEnum(data?: Partial<BlankEnum>): BlankEnum {\n  return (data as BlankEnum) ?? (undefined as never)\n}',
  )

  fs.writeFileSync(blankEnumPath, content)
}

patchIndex()
patchBlankEnum()
console.log('Applied Kubb compatibility patches.')
