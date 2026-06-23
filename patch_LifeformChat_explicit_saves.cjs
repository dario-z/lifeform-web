/* 
 * Safe patch for src/components/LifeformChat.tsx
 * Creates a backup before applying deterministic explicit-save support.
 */
const fs = require('fs');
const path = require('path');

const target = path.resolve(
  process.cwd(),
  'src',
  'components',
  'LifeformChat.tsx',
);

if (!fs.existsSync(target)) {
  throw new Error(
    'File not found: ' + target + '\nRun this script from C:\\Projects\\lifeform-web.',
  );
}

let source = fs.readFileSync(target, 'utf8');

function replaceBetween(startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      'Could not find the expected ' + label + ' block. No changes were written.',
    );
  }

  source =
    source.slice(0, start) +
    replacement +
    '\n\n' +
    source.slice(end);
}

function replaceOnce(search, replacement, label) {
  const count = source.split(search).length - 1;

  if (count !== 1) {
    throw new Error(
      'Expected exactly one ' + label + ' occurrence, found ' + count +
      '. No changes were written.',
    );
  }

  source = source.replace(search, replacement);
}

const parser = `function normalizeMemoryRequestText(
  value: string,
): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
}

type ExplicitSaveKind =
  | 'memory'
  | 'goal'
  | 'belief'
  | 'thread'
  | 'auto'

type ExplicitSaveIntent = {
  kind: ExplicitSaveKind
}

function getExplicitSaveIntent(
  message: string,
): ExplicitSaveIntent | null {
  const normalized =
    normalizeMemoryRequestText(message)

  const actionPattern =
    /\\b(ricorda|ricordati|memorizza|salva|registra|inserisci|aggiungi|crea|annota|segna|remember|save|store|record|add|create|memorize|memorise|sauvegarde|enregistre|ajoute|cree|speichere|merke|fuge|erstelle|recuerda|guarda|almacena|anade|agrega)\\b/

  const negatedActionPattern =
    /\\b(non|don't|do not|ne pas|nicht|no)\\b.{0,28}\\b(ricorda|ricordati|memorizza|salva|registra|inserisci|aggiungi|crea|annota|segna|remember|save|store|record|add|create|memorize|memorise|sauvegarde|enregistre|ajoute|cree|speichere|merke|fuge|erstelle|recuerda|guarda|almacena|anade|agrega)\\b/

  if (
    !actionPattern.test(normalized) ||
    negatedActionPattern.test(normalized)
  ) {
    return null
  }

  const mentionsGoal =
    /\\b(goal|goals|obiettivo|obiettivi|obbiettivo|obbiettivi|objective|objectifs|ziel|ziele|meta|metas)\\b/.test(
      normalized,
    )

  const mentionsBelief =
    /\\b(belief|beliefs|convinzione|convinzioni|credenza|credenze|principio|principi|conviction|convictions|croyance|croyances|uberzeugung|uberzeugungen|creencia|creencias)\\b/.test(
      normalized,
    )

  const mentionsThread =
    /\\b(thread|threads|filone|filoni|contesto attivo|contesti attivi|progetto attivo|progetti attivi|ongoing project|ongoing thread|workstream|work stream)\\b/.test(
      normalized,
    )

  const mentionsMemory =
    /\\b(key memory|key memories|memoria chiave|memorie chiave|memoria|memorie|memory|memories|memoire|memoires|erinnerung|erinnerungen|memoria clave|memorias clave)\\b/.test(
      normalized,
    )

  if (mentionsGoal) {
    return { kind: 'goal' }
  }

  if (mentionsBelief) {
    return { kind: 'belief' }
  }

  if (mentionsThread) {
    return { kind: 'thread' }
  }

  if (mentionsMemory) {
    return { kind: 'memory' }
  }

  /*
   * Verbi come "ricorda" o "ricordati" implicano
   * una memoria, anche senza nominare "Key Memory".
   */
  if (
    /\\b(ricorda|ricordati|memorizza|remember|memorize|memorise|mémorise|recuerda|merke)\\b/.test(
      normalized,
    )
  ) {
    return { kind: 'memory' }
  }

  /*
   * "Salva questo", "aggiungi questa cosa", ecc.
   * vengono estratti dal contesto recente.
   */
  const refersToContext =
    /\\b(questo|questa|questi|queste|quello|quella|cio|cosa|quanto detto|quello che abbiamo detto|this|that|these|those|the above|ceci|cela|dies|das|esto|esta|eso|lo anterior)\\b/.test(
      normalized,
    )

  if (refersToContext) {
    return { kind: 'auto' }
  }

  return null
}`;

const threadExtractor = `async function extractThreadProposalCandidate({
  apiKey,
  model,
  lifeformName,
  activeThreads,
  activeGoals,
  recentHistory,
  userMessage,
  assistantResponse,
  mode = 'autonomous',
}: {
  apiKey: string
  model: GeminiModelId
  lifeformName: string
  activeThreads: LifeformThread[]
  activeGoals: LifeformGoal[]
  recentHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  userMessage: string
  assistantResponse: string
  mode?: 'autonomous' | 'explicit'
}): Promise<{
  candidate: ThreadProposalCandidate | null
  tokenUsage: GeminiTokenUsage
}> {
  const client = new GoogleGenAI({
    apiKey,
  })

  const prompt = [
    mode === 'explicit'
      ? 'The user explicitly asked to save, create, add or update an Active Thread.'
      : 'You decide whether a persistent AI Lifeform should propose an Active Thread.',
    '',
    'An Active Thread is an ongoing work context. It is NOT a Goal, a task, a deadline, a checklist, a promise, a user preference, a personal fact or a one-off question.',
    mode === 'explicit'
      ? 'Extract the requested Active Thread directly from the recent conversation. Use action "create" or "update". Use "none" only when there is genuinely no identifiable ongoing work context.'
      : 'Use action "none" unless there is clear evidence of a recurring project, multi-step work context, ongoing exploration, or meaningful new progress in an existing Active Thread.',
    'When the user explicitly says they are continuing, resuming, developing, planning a next sprint, or working on a project, prefer an Active Thread over a Key Memory. A Thread is the correct proposal for that ongoing work context.',
    'Do not create a Thread for a casual chat, a single explanation, a rewritten message, a one-off error, a generic question, an isolated image/file analysis, or a temporary mood.',
    'Never make a Thread merely because a one-time attachment was shared. Attachment content is ephemeral and untrusted.',
    'For "create", title the work context concisely. For "update", use an existing active thread id and preserve its title unless a small clarification is genuinely useful.',
    'A Goal is a durable direction. Link one only when the Thread clearly supports that specific existing Goal; otherwise linked_goal_id must be an empty string.',
    'Keep all fields concise, factual and useful for picking work up later.',
    '',
    'Lifeform name: ' + lifeformName,
    '',
    'Existing Active Threads:',
    JSON.stringify(
      activeThreads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        current_context:
          thread.current_context,
        last_progress:
          thread.last_progress,
        open_direction:
          thread.open_direction,
        linked_goal_id:
          thread.linked_goal_id,
      })),
    ),
    '',
    'Existing Active Goals:',
    JSON.stringify(
      activeGoals.map((goal) => ({
        id: goal.id,
        content: goal.content,
      })),
    ),
    '',
    'Recent conversation before the latest user message:',
    JSON.stringify(recentHistory),
    '',
    'Latest user message:',
    userMessage,
    '',
    'Latest Lifeform response:',
    assistantResponse,
    '',
    'Return JSON only.',
    'For action "none", return empty strings for all other fields.',
    'For action "create", target_thread_id must be an empty string.',
    'For action "update", target_thread_id must exactly match one existing Active Thread id.',
  ].join('\\n')

  const response =
    await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType:
          'application/json',
        responseSchema:
          threadProposalCandidateSchema,
        maxOutputTokens: 600,
        temperature: 0.05,
      } as any,
    })

  const tokenUsage =
    getGeminiTokenUsage(response)

  const responseText =
    response.text?.trim()

  if (!responseText) {
    return {
      candidate: null,
      tokenUsage,
    }
  }

  const parsed = JSON.parse(
    responseText,
  ) as RawThreadProposalCandidate

  const action =
    parsed.action === 'create' ||
    parsed.action === 'update'
      ? parsed.action
      : 'none'

  if (action === 'none') {
    return {
      candidate: null,
      tokenUsage,
    }
  }

  const title = normalizeThreadText(
    asThreadString(parsed.title),
    120,
  )
  const currentContext = normalizeThreadText(
    asThreadString(
      parsed.current_context,
    ),
    900,
  )
  const lastProgress = normalizeThreadText(
    asThreadString(
      parsed.last_progress,
    ),
    700,
  )
  const openDirection = normalizeThreadText(
    asThreadString(
      parsed.open_direction,
    ),
    700,
  )

  if (
    title.length < 2 ||
    currentContext.length < 8 ||
    lastProgress.length < 8 ||
    openDirection.length < 4
  ) {
    return {
      candidate: null,
      tokenUsage,
    }
  }

  const requestedTargetId =
    normalizeThreadText(
      asThreadString(
        parsed.target_thread_id,
      ),
      100,
    )

  const targetThread =
    activeThreads.find(
      (thread) =>
        thread.id === requestedTargetId,
    ) ?? null

  const similarThread =
    findSimilarThread(
      activeThreads,
      title,
    )

  const resolvedTarget =
    action === 'update'
      ? targetThread
      : similarThread

  const linkedGoalId =
    activeGoals.some(
      (goal) =>
        goal.id ===
        normalizeThreadText(
          asThreadString(
            parsed.linked_goal_id,
          ),
          100,
        ),
    )
      ? normalizeThreadText(
          asThreadString(
            parsed.linked_goal_id,
          ),
          100,
        )
      : null

  return {
    candidate: {
      action: resolvedTarget
        ? 'update'
        : 'create',
      targetThreadId:
        resolvedTarget?.id ?? null,
      title:
        resolvedTarget?.title ?? title,
      currentContext,
      lastProgress,
      openDirection,
      linkedGoalId,
      reason: normalizeThreadText(
        asThreadString(parsed.reason),
        280,
      ),
    },
    tokenUsage,
  }
}`;

const persistThread = `  const persistConfirmedThreadProposal =
    async (
      proposal: LifeformThreadProposal,
      source: 'proposal' | 'manual' = 'proposal',
    ) => {
      const title = normalizeThreadText(
        proposal.title,
        120,
      )
      const currentContext =
        normalizeThreadText(
          proposal.current_context,
          900,
        )
      const lastProgress =
        normalizeThreadText(
          proposal.last_progress,
          700,
        )
      const openDirection =
        normalizeThreadText(
          proposal.open_direction,
          700,
        )

      if (
        title.length < 2 ||
        currentContext.length < 8 ||
        lastProgress.length < 8 ||
        openDirection.length < 4
      ) {
        throw new Error(
          'The proposed Thread is incomplete.',
        )
      }

      const linkedGoalId =
        proposal.linked_goal_id &&
        goalsRef.current.some(
          (goal) =>
            goal.id ===
            proposal.linked_goal_id,
        )
          ? proposal.linked_goal_id
          : null

      const currentThreads = threadsRef.current
      const targetThread =
        proposal.target_thread_id
          ? currentThreads.find(
              (thread) =>
                thread.id ===
                proposal.target_thread_id,
            )
          : null

      const similarThread =
        targetThread ??
        findSimilarThread(
          currentThreads,
          title,
        )

      const now = new Date().toISOString()

      if (similarThread) {
        const { data, error } = await supabase
          .from('lifeform_threads')
          .update({
            title,
            current_context: currentContext,
            last_progress: lastProgress,
            open_direction: openDirection,
            linked_goal_id: linkedGoalId,
            source,
            updated_at: now,
            last_activity_at: now,
          })
          .eq('id', similarThread.id)
          .eq('lifeform_id', lifeform.id)
          .select()
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error(
            'The updated Thread was not returned by the database.',
          )
        }

        commitThreads([
          ...currentThreads.filter(
            (thread) =>
              thread.id !== similarThread.id,
          ),
          data as LifeformThread,
        ])

        return
      }

      if (
        currentThreads.filter(
          (thread) =>
            thread.status === 'active',
        ).length >= MAX_ACTIVE_THREADS
      ) {
        throw new Error(
          'The active Threads limit is reached. Archive or delete one before accepting another Thread.',
        )
      }

      const { data, error } = await supabase
        .from('lifeform_threads')
        .insert({
          user_id: lifeform.user_id,
          lifeform_id: lifeform.id,
          title,
          current_context: currentContext,
          last_progress: lastProgress,
          open_direction: openDirection,
          linked_goal_id: linkedGoalId,
          status: 'active',
          source,
          last_activity_at: now,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error(
          'The confirmed Thread was not returned by the database.',
        )
      }

      commitThreads([
        ...currentThreads,
        data as LifeformThread,
      ])
    }`;

const initialIntent = `    const explicitSaveIntent =
      !attachment
        ? getExplicitSaveIntent(
            cleanMessage,
          )
        : null

    const explicitMemoryLikeRequest =
      explicitSaveIntent?.kind === 'memory' ||
      explicitSaveIntent?.kind === 'goal' ||
      explicitSaveIntent?.kind === 'belief' ||
      explicitSaveIntent?.kind === 'auto'

    const explicitThreadRequest =
      explicitSaveIntent?.kind === 'thread'`;

const memoryExtraction = `        if (explicitMemoryLikeRequest) {
          if (analysis.memoryCandidate) {
            requestedMemoryInput =
              keyMemoryCandidateToInput(
                analysis.memoryCandidate,
              )
          }

          if (!requestedMemoryInput) {
            try {
              const requestedMemory =
                await extractRequestedKeyMemory({
                  apiKey,
                  model: selectedModel,
                  lifeformName:
                    lifeform.name,
                  keyMemories:
                    keyMemoriesRef.current,
                  recentHistory:
                    previousContext.slice(
                      -GEMINI_CONTEXT_SIZE,
                    ),
                  userMessage:
                    cleanMessage,
                  assistantResponse,
                })

              requestedMemoryInput =
                requestedMemory.input

              requestedMemoryTokenUsage =
                requestedMemory.tokenUsage
            } catch (memoryExtractionError: unknown) {
              console.warn(
                'Estrazione del salvataggio richiesto non riuscita:',
                memoryExtractionError,
              )
            }
          }

          if (
            requestedMemoryInput &&
            explicitSaveIntent?.kind === 'goal'
          ) {
            requestedMemoryInput =
              normalizeKeyMemoryInput({
                ...requestedMemoryInput,
                category: 'long_term_goal',
              })
          }

          if (
            requestedMemoryInput &&
            explicitSaveIntent?.kind === 'belief'
          ) {
            requestedMemoryInput =
              normalizeKeyMemoryInput({
                ...requestedMemoryInput,
                category: 'lifeform_belief',
              })
          }
        }`;

const shouldCheckThread = `        const shouldCheckThread =
          !explicitSaveIntent &&
          !pendingProposalRef.current &&
          !pendingThreadProposalRef.current &&
          shouldEvaluateThreadProposal({
            userMessage: storedUserMessage,
            activeThreads,
          })`;

const finalPersist = `        try {
          if (!attachment) {
            if (explicitThreadRequest) {
              if (!threadCandidate) {
                throw new Error(
                  'Non sono riuscita a estrarre un Thread utile dal contesto recente.',
                )
              }

              await persistConfirmedThreadProposal(
                {
                  id: 'manual-request',
                  user_id: lifeform.user_id,
                  lifeform_id: lifeform.id,
                  action: threadCandidate.action,
                  target_thread_id:
                    threadCandidate.targetThreadId,
                  title: threadCandidate.title,
                  current_context:
                    threadCandidate.currentContext,
                  last_progress:
                    threadCandidate.lastProgress,
                  open_direction:
                    threadCandidate.openDirection,
                  linked_goal_id:
                    threadCandidate.linkedGoalId,
                  status: 'accepted',
                  reason: threadCandidate.reason,
                  created_at:
                    new Date().toISOString(),
                  decided_at:
                    new Date().toISOString(),
                },
                'manual',
              )
            } else if (explicitMemoryLikeRequest) {
              if (!requestedMemoryInput) {
                throw new Error(
                  'Non sono riuscita a estrarre un salvataggio utile dal contesto recente.',
                )
              }

              await saveUserRequestedKeyMemory(
                requestedMemoryInput,
              )
            } else if (
              shouldQueueAutonomousMemoryProposal({
                candidate: analysis.memoryCandidate,
                userMessage: storedUserMessage,
                threadPriority,
              })
            ) {
              await queueAutonomousMemoryProposal(
                analysis.memoryCandidate,
              )
            }
          }
        } catch (memoryError: unknown) {
          console.warn(
            'Explicit save or autonomous proposal update was not available:',
            memoryError,
          )

          if (explicitSaveIntent) {
            setError(
              'The reply was sent, but the requested item could not be saved: ' +
                getErrorMessage(
                  memoryError,
                ),
            )
          }
        }`;

replaceBetween(
  'function normalizeMemoryRequestText(',
  'function getValidKeyMemoryCategory(',
  parser,
  'explicit-save parser',
);

replaceBetween(
  'async function extractThreadProposalCandidate({',
  'function sortKeyMemories(',
  threadExtractor,
  'Thread extraction function',
);

replaceBetween(
  '  const persistConfirmedThreadProposal =',
  '  const handleAcceptThreadProposal =',
  persistThread,
  'Thread persistence function',
);

replaceBetween(
  '    const explicitKeyMemoryRequest =',
  '    let immediateReaction:',
  initialIntent,
  'initial explicit-save intent',
);

replaceBetween(
  '        if (explicitKeyMemoryRequest) {',
  '        const activeThreads =',
  memoryExtraction,
  'explicit memory extraction',
);

replaceBetween(
  '        const shouldCheckThread =',
  '        let threadCandidate:',
  shouldCheckThread,
  'Thread proposal gate',
);

replaceOnce(
  '        if (shouldCheckThread) {',
  `        if (
          shouldCheckThread ||
          explicitThreadRequest
        ) {`,
  'Thread extraction condition',
);

replaceOnce(
  `                userMessage: storedUserMessage,
                assistantResponse,
              })`,
  `                userMessage: storedUserMessage,
                assistantResponse,
                mode: explicitThreadRequest
                  ? 'explicit'
                  : 'autonomous',
              })`,
  'Thread extractor call',
);

replaceOnce(
  `          if (threadCandidate) {
            await queueAutonomousThreadProposal(
              threadCandidate,
            )
          }`,
  `          if (
            threadCandidate &&
            !explicitThreadRequest
          ) {
            await queueAutonomousThreadProposal(
              threadCandidate,
            )
          }`,
  'autonomous Thread queue condition',
);

replaceBetween(
  '        try {\n          if (!attachment) {\n            if (explicitKeyMemoryRequest) {',
  '        immediateReaction = {',
  finalPersist,
  'final explicit-save persistence',
);

replaceOnce(
  `        'If the user explicitly asks you to create, save, register or update a Key Memory, acknowledge that the application will save it after your reply. Do not falsely claim that it has already been saved before storage has completed.',`,
  `        'If the user explicitly asks you to create, save, register or update a Key Memory, Goal, Belief or Thread, acknowledge that the application will save it after your reply. Do not falsely claim that it has already been saved before storage has completed.',`,
  'system instruction',
);

// Remove a duplicated blank indentation side-effect before immediateReaction if any.
source = source.replace(
  /\n\n\s{8}immediateReaction = \{/g,
  '\n\n        immediateReaction = {',
);

const backup = target + '.before-explicit-saves.bak';
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
}

fs.writeFileSync(target, source, 'utf8');

console.log('Patched successfully: ' + target);
console.log('Backup created: ' + backup);
