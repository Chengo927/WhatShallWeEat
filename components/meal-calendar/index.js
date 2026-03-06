const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => `${index + 1}月`)
const MAX_VISIBLE_EMOJI_MARKS = 4

function formatDate(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(dateStr) {
  const matches = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '')
  if (!matches) {
    return null
  }

  const year = Number(matches[1])
  const month = Number(matches[2])
  const day = Number(matches[3])
  const dateObj = new Date(year, month - 1, day)
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return null
  }

  return dateObj
}

function normalizeEmojiMarks(rawValue) {
  if (!Array.isArray(rawValue)) {
    return []
  }
  const validEmojiList = rawValue.filter((emoji) => typeof emoji === 'string' && emoji)
  return Array.from(new Set(validEmojiList))
}

function buildDayMarks(date, marksByDate) {
  if (!marksByDate || typeof marksByDate !== 'object') {
    return {
      marks: [],
      marksExtra: ''
    }
  }

  const normalizedEmojiList = normalizeEmojiMarks(marksByDate[date])
  const marks = normalizedEmojiList.slice(0, MAX_VISIBLE_EMOJI_MARKS)
  const extraCount = normalizedEmojiList.length - marks.length

  return {
    marks,
    marksExtra: extraCount > 0 ? `+${extraCount}` : ''
  }
}

function buildDayCell(dateObj, isCurrentMonth, selectedDate, marksByDate) {
  const date = formatDate(dateObj)
  const { marks, marksExtra } = buildDayMarks(date, marksByDate)
  return {
    key: date,
    date,
    day: dateObj.getDate(),
    currentMonth: isCurrentMonth,
    selected: date === selectedDate,
    marks,
    marksExtra
  }
}

function buildMonthDays(year, month, selectedDate, marksByDate) {
  const monthStartWeekday = new Date(year, month - 1, 1).getDay()
  const monthDays = new Date(year, month, 0).getDate()
  const days = []

  for (let offset = monthStartWeekday; offset > 0; offset -= 1) {
    const prevDateObj = new Date(year, month - 1, 1 - offset)
    days.push(buildDayCell(prevDateObj, false, selectedDate, marksByDate))
  }

  for (let day = 1; day <= monthDays; day += 1) {
    const dateObj = new Date(year, month - 1, day)
    days.push(buildDayCell(dateObj, true, selectedDate, marksByDate))
  }

  let nextDayOffset = 1
  while (days.length < 42) {
    const nextDateObj = new Date(year, month - 1, monthDays + nextDayOffset)
    days.push(buildDayCell(nextDateObj, false, selectedDate, marksByDate))
    nextDayOffset += 1
  }

  return days
}

Component({
  properties: {
    value: {
      type: String,
      value: '',
      observer() {
        this.resetCalendarByValue()
      }
    },
    marks: {
      type: Object,
      value: {},
      observer() {
        this.refreshCurrentMonthDays()
      }
    },
    yearSpan: {
      type: Number,
      value: 10
    }
  },

  data: {
    weekdays: WEEKDAYS,
    yearValues: [],
    yearMonthRange: [[], MONTH_LABELS],
    yearMonthValue: [0, 0],
    displayYear: 0,
    displayMonth: 0,
    selectedDate: '',
    days: []
  },

  lifetimes: {
    attached() {
      this.resetCalendarByValue()
    }
  },

  methods: {
    getYearSpan() {
      const span = Number(this.properties.yearSpan)
      if (!Number.isFinite(span) || span < 0) {
        return 10
      }
      return Math.floor(span)
    },

    ensureYearValues(targetYear) {
      const yearSpan = this.getYearSpan()
      const yearValues = []
      const startYear = targetYear - yearSpan
      const endYear = targetYear + yearSpan

      for (let year = startYear; year <= endYear; year += 1) {
        yearValues.push(year)
      }

      return yearValues
    },

    syncYearMonthPicker(displayYear, displayMonth) {
      let yearValues = this.data.yearValues
      let yearIndex = yearValues.indexOf(displayYear)
      if (yearIndex < 0) {
        yearValues = this.ensureYearValues(displayYear)
        yearIndex = yearValues.indexOf(displayYear)
      }

      const yearLabels = yearValues.map((year) => `${year}年`)
      const monthIndex = Math.max(0, Math.min(11, Number(displayMonth) - 1))
      this.setData({
        yearValues,
        yearMonthRange: [yearLabels, MONTH_LABELS],
        yearMonthValue: [yearIndex < 0 ? 0 : yearIndex, monthIndex]
      })
    },

    refreshCurrentMonthDays() {
      if (!this.data.displayYear || !this.data.displayMonth) {
        return
      }
      const days = buildMonthDays(
        this.data.displayYear,
        this.data.displayMonth,
        this.data.selectedDate,
        this.properties.marks
      )
      this.setData({ days })
    },

    resetCalendarByValue() {
      const targetDate = parseDate(this.properties.value) || new Date()
      const selectedDate = formatDate(targetDate)
      const displayYear = targetDate.getFullYear()
      const displayMonth = targetDate.getMonth() + 1
      const days = buildMonthDays(displayYear, displayMonth, selectedDate, this.properties.marks)
      const yearValues = this.ensureYearValues(displayYear)
      const yearLabels = yearValues.map((year) => `${year}年`)

      this.setData({
        selectedDate,
        displayYear,
        displayMonth,
        yearValues,
        yearMonthRange: [yearLabels, MONTH_LABELS],
        yearMonthValue: [yearValues.indexOf(displayYear), displayMonth - 1],
        days
      })
    },

    updateCalendar(displayYear, displayMonth) {
      const days = buildMonthDays(
        displayYear,
        displayMonth,
        this.data.selectedDate,
        this.properties.marks
      )
      this.setData({
        displayYear,
        displayMonth,
        days
      })
    },

    onYearMonthChange(event) {
      const [yearIndex, monthIndex] = (event.detail && event.detail.value) || []
      const yearValues = this.data.yearValues || []
      const targetYear = yearValues[Number(yearIndex)]
      const targetMonth = Number(monthIndex) + 1

      if (!targetYear || !targetMonth) {
        return
      }

      this.updateCalendar(targetYear, targetMonth)
      this.syncYearMonthPicker(targetYear, targetMonth)
    },

    onYearMonthCancel() {
      this.syncYearMonthPicker(this.data.displayYear, this.data.displayMonth)
    },

    onSelectDate(event) {
      const { date } = event.currentTarget.dataset || {}
      const dateObj = parseDate(date)
      if (!dateObj) {
        return
      }

      const displayYear = dateObj.getFullYear()
      const displayMonth = dateObj.getMonth() + 1
      const days = buildMonthDays(displayYear, displayMonth, date, this.properties.marks)

      this.setData(
        {
          selectedDate: date,
          displayYear,
          displayMonth,
          days
        },
        () => {
          this.syncYearMonthPicker(displayYear, displayMonth)
          this.triggerEvent('confirm', { date })
          this.triggerEvent('change', { date })
        }
      )
    }
  }
})
