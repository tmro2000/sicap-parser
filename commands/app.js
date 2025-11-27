import React, { useMemo, useState } from "react"
import { Box, Text, useInput } from "ink"

import { Container } from "../components"
import { yesterday } from "../lib/utils"
import Achizitii from "./achizitii"
import Licitatii from "./licitatii"

const defaults = {
  host: "http://localhost:9200",
  licitatiiIndex: "licitatii-publice",
  achizitiiIndex: "achizitii-directe",
  concurrency: 5,
}

const normalizeBoolean = (value) => value.toLowerCase().startsWith("y")
const normalizeMode = (value) => (value.toLowerCase().startsWith("a") ? "achizitii" : "licitatii")
const normalizeNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

function InterfaceApp() {
  const [answers, setAnswers] = useState({
    mode: "licitatii",
  })
  const [buffer, setBuffer] = useState("")
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [finalConfig, setFinalConfig] = useState(null)

  const prompts = useMemo(
    () => [
      {
        name: "mode",
        label: "Selecteaza tipul de date (l = licitatii, a = achizitii)",
        defaultValue: "l",
        normalize: normalizeMode,
      },
      {
        name: "date",
        label: "Data (zz-ll-aaaa)",
        defaultValue: yesterday(),
      },
      {
        name: "host",
        label: "Elasticsearch host",
        defaultValue: defaults.host,
      },
      {
        name: "index",
        label: answers.mode === "achizitii" ? "Index Elasticsearch pentru achizitii" : "Index Elasticsearch pentru licitatii",
        defaultValue: answers.mode === "achizitii" ? defaults.achizitiiIndex : defaults.licitatiiIndex,
      },
      {
        name: "concurrency",
        label: "Numar accesari concurente",
        defaultValue: defaults.concurrency,
        normalize: (value) => normalizeNumber(value, defaults.concurrency),
      },
      {
        name: "archive",
        label: "Foloseste arhiva istorica? (y/n)",
        defaultValue: "n",
        normalize: normalizeBoolean,
      },
    ],
    [answers.mode]
  )

  const isComplete = Boolean(finalConfig)
  const currentPrompt = prompts[currentPromptIndex]

  useInput((input, key) => {
    if (isComplete) {
      return
    }

    if (key.return) {
      const rawValue = buffer.trim() === "" ? String(currentPrompt.defaultValue) : buffer.trim()
      const normalizedValue = currentPrompt.normalize
        ? currentPrompt.normalize(rawValue, answers)
        : rawValue

      const nextAnswers = { ...answers, [currentPrompt.name]: normalizedValue }
      setAnswers(nextAnswers)
      setBuffer("")

      if (currentPromptIndex === prompts.length - 1) {
        setFinalConfig(nextAnswers)
      } else {
        setCurrentPromptIndex((index) => index + 1)
      }

      return
    }

    if (key.backspace || key.delete) {
      setBuffer((value) => value.slice(0, -1))
      return
    }

    if (!key.ctrl && !key.meta) {
      setBuffer((value) => value + input)
    }
  })

  if (isComplete) {
    const config = finalConfig
    const SelectedCommand = config.mode === "achizitii" ? Achizitii : Licitatii

    return (
      <Container>
        <Box marginBottom={1} flexDirection="column">
          <Text>
            {`Pornire ${config.mode} pentru ${config.date} (index: ${config.index}, host: ${config.host}) | concurenta: ${config.concurrency} | arhiva: ${config.archive ? "da" : "nu"}`}
          </Text>
          <Text color="gray">Apasa Ctrl+C pentru a opri.</Text>
        </Box>
        <SelectedCommand
          date={config.date}
          host={config.host}
          index={config.index}
          concurrency={config.concurrency}
          archive={config.archive}
        />
      </Container>
    )
  }

  return (
    <Container>
      <Box flexDirection="column">
        <Text>Asistent interactiv SICAP</Text>
        <Text color="gray">Lasa campul gol si apasa Enter pentru a folosi valoarea implicita.</Text>
        <Box marginTop={1}>
          <Text>
            {currentPrompt.label}
            {` [${currentPrompt.defaultValue}] > ${buffer}`}
          </Text>
        </Box>
        {currentPromptIndex > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text color="gray">Valori curente:</Text>
            {Object.entries(answers).map(([key, value]) => (
              <Text key={key}>{`${key}: ${value}`}</Text>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default InterfaceApp
