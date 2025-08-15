# Comment Écrire de Bons Commits Git

De bons messages de commit sont essentiels pour la santé d'un projet. Ils fournissent du contexte, suivent les changements et facilitent la collaboration et le débogage. Suivez ces directives pour rendre vos commits informatifs et utiles.

## 1. La Règle d'Or : Séparer le Sujet du Corps

Un message de commit bien conçu comporte deux parties : une ligne de sujet et un corps optionnel plus détaillé. Séparez-les par une ligne vide.

```Ligne de sujet (50-72 caractères)```

```Optionnel :``` Explication plus longue de votre message de commit,
fournissant plus de contexte, de détails et de raisonnement.
Limitez les lignes à 72 caractères.

## 2. La Ligne de Sujet

La ligne de sujet est la partie la plus importante de votre message de commit. Elle doit être concise, claire et informative.

- **Gardez-la courte** : Visez 50 caractères ou moins, et idéalement ne dépassez jamais 72 caractères. Cela garantit la lisibilité dans divers outils Git (par exemple, git log --oneline, l'historique des commits de GitHub).

- **Mettez la première lettre en majuscule** : Commencez la ligne de sujet par une majuscule.

- **Ne terminez pas par un point** : Omettez la ponctuation finale.

- **Utilisez l'impératif** : Écrivez la ligne de sujet comme si vous donniez un ordre. Par exemple :
  - **Bon :** Fix: Corrige l'erreur off-by-one dans la boucle
  - **Mauvais :** Corrigé l'erreur off-by-one dans la boucle
  - **Mauvais :** Corrige : Erreur off-by-one dans la boucle

- **Concentrez-vous sur le quoi et le pourquoi, pas le comment** : Le sujet doit expliquer ce que fait le commit. Le corps peut expliquer pourquoi et comment.

### Préfixes Courants pour la Ligne de Sujet (Catégorisation)

L'utilisation de préfixes aide à catégoriser vos commits et fournit un contexte immédiat. Soyez cohérent dans votre projet.

- **`feat:` (Fonctionnalité)** : Une nouvelle fonctionnalité.
  - Exemple : feat: Ajoute le système d'authentification utilisateur

- **`fix:` (Correction de Bug)** : Une correction de bug.
  - Exemple : fix: Résout la boucle infinie dans le processus de connexion

- **`docs:` (Documentation)** : Modifications de la documentation.
  - Exemple : docs: Met à jour le README avec les instructions d'installation

- **`style:` (Style de Code)** : Modifications qui n'affectent pas la signification du code (espaces, formatage, points-virgules manquants, etc.).
  - Exemple : style: Formate le code selon les règles Prettier

- **`refactor:` (Refactorisation)** : Une modification de code qui ne corrige pas de bug ni n'ajoute de fonctionnalité.
  - Exemple : refactor: Extrait la validation utilisateur vers un module séparé

- **`perf:` (Performance)** : Une modification de code qui améliore les performances.
  - Exemple : perf: Optimise les requêtes de base de données pour un chargement plus rapide

- **`test:` (Tests)** : Ajout de tests manquants ou correction de tests existants.
  - Exemple : test: Ajoute des tests unitaires pour les endpoints API

- **`build:` (Système de Build)** : Modifications qui affectent le système de build ou les dépendances externes (par exemple, gulp, broccoli, npm).
  - Exemple : build: Met à jour webpack vers la version 5

- **`ci:` (Intégration Continue)** : Modifications des fichiers de configuration CI et des scripts (par exemple, Travis, Circle, GitLab CI).
  - Exemple : ci: Ajoute les tests E2E au pipeline CI

- **`chore:` (Tâches/Maintenance)** : Autres modifications qui ne modifient pas les fichiers src ou test.
  - Exemple : chore: Met à jour gitignore avec les nouveaux fichiers temporaires

- **`revert:` (Annulations)** : Annule un commit précédent.
  - Exemple : revert: feat: Ajoute le mécanisme de cache expérimental

## 3. Le Corps (Optionnel mais Recommandé)

Le corps du commit fournit un contexte et une explication supplémentaires.

- **Expliquez pourquoi le changement a été fait** : Quel problème ce commit résout-il ? Quelle était la motivation derrière le changement ?

- **Expliquez comment cela a été fait (brièvement)** : Si l'implémentation est complexe ou a des implications significatives, fournissez un aperçu de haut niveau. Évitez de plonger dans les explications ligne par ligne du code.

- **Détaillez les compromis ou alternatives** : Si vous avez considéré différentes approches, mentionnez pourquoi vous avez choisi cette approche particulière.

- **Référencez les issues/PRs liées** : Liez aux trackers d'issues (par exemple, Fixes #123, Closes #456) ou aux pull requests. Cela aide à automatiser la fermeture des issues et fournit une traçabilité.

- **Limitez les lignes à 72 caractères** : Cela améliore la lisibilité dans git log et autres outils.

- **Utilisez des puces pour les listes** : Si vous avez plusieurs points distincts à faire, utilisez des tirets ou des astérisques pour la lisibilité.

### Exemple d'un Bon Message de Commit

```
feat: Implémente la fonctionnalité d'édition de profil utilisateur

Ce commit introduit la capacité pour les utilisateurs authentifiés
d'éditer leurs informations de profil, incluant nom, email et
mot de passe.

Précédemment, les utilisateurs ne pouvaient que voir leurs profils.
Cette fonctionnalité répond à l'issue #789, permettant un meilleur
contrôle utilisateur et une précision des données.

L'implémentation inclut :
- Un nouvel endpoint API pour les mises à jour de profil (`/api/users/:id/profile`).
- Validation côté client pour tous les champs de saisie.
- Intégration avec le middleware d'authentification existant pour
  s'assurer que seuls les utilisateurs autorisés peuvent modifier
  leurs propres profils.

A considéré une mise à jour sur une seule page mais a opté pour
un changement de mot de passe séparé pour des raisons de sécurité.
```

## 4. Commits Atomiques : Faire Une Chose et Bien la Faire

- Chaque commit doit représenter un seul changement logique. Évitez de mélanger plusieurs changements non liés (par exemple, corriger un bug, ajouter une fonctionnalité, et refactoriser du code non lié dans un seul commit).

- Si vous n'êtes pas sûr, demandez-vous : "Ce commit peut-il être annulé indépendamment sans affecter d'autres changements désirés ?" Si non, considérez le diviser.

- Des commits plus petits et focalisés sont plus faciles à comprendre, réviser et annuler si nécessaire.

## 5. Soyez Cohérent

- Suivez le style de message de commit existant du projet. S'il n'y a pas de style établi, discutez et convenez d'un avec votre équipe.

- La cohérence rend l'historique des commits plus facile à analyser pour tous les participants.

## 6. Révisez Vos Commits

- Avant de pousser, révisez toujours vos commits en utilisant git log, git diff HEAD~1, ou un outil GUI Git.

- Lisez votre message de commit comme si vous étiez un autre développeur (ou votre futur vous) essayant de comprendre le changement. Est-ce clair ? Est-ce complet ?

## 7. Utilisez le Rebase Interactif pour Nettoyer l'Historique

Parfois, vos commits locaux peuvent être désordonnés. Avant de pousser vers une branche partagée, utilisez git rebase -i pour :

- Squasher des commits liés en un seul, plus significatif.
- Réordonner les commits.
- Éditer les messages de commit.
- Corriger de petits changements dans des commits précédents.

**Attention :** Ne rebasez jamais des commits qui ont déjà été poussés vers une branche distante partagée, car cela réécrit l'historique et peut causer des problèmes pour les collaborateurs.

## Outils et Conseils Pratiques

- **Git Hooks** : Vous pouvez configurer des hooks Git côté client (par exemple, hook commit-msg) pour automatiquement appliquer les directives de message de commit.

- **Commitizen** : Un utilitaire en ligne de commande qui vous aide à vous conformer à une convention spécifique de message de commit.

- **Linters** : Des outils comme commitlint peuvent valider vos messages de commit contre des règles prédéfinies.

- **Intégrations IDE** : Beaucoup d'IDEs (VS Code, IntelliJ) ont des extensions qui aident à écrire de bons messages de commit.



























# How to Write Good Git Commits

    Good commit messages are vital for project health. They provide context, track changes, and facilitate collaboration and debugging. Follow these guidelines to make your commits informative and useful.

1. The Golden Rule: Separate Subject from Body

A well-crafted commit message has two parts: a subject line and an optional, more detailed body. Separate them with a blank line.

```Subject line (50-72 characters)```

```Optional:``` Longer explanation of your commit message,
providing more context, details, and reasoning.
Wrap lines at 72 characters.

2. The Subject Line

The subject line is the most important part of your commit message. It should be concise, clear, and informative.

    Keep it short: Aim for 50 characters or less, and ideally never exceed 72 characters. This ensures readability in various Git tools (e.g., git log --oneline, GitHub's commit history).

    Capitalize the first letter: Start the subject line with a capital letter.

    Do not end with a period: Omit trailing punctuation.

    Use the imperative mood: Write the subject line as if you are giving a command. For example:
***
        ``Good:`` Fix: Correct off-by-one error in loop

       ``Bad:`` Fixed off-by-one error in loop

        ``Bad:`` Fixes: Off-by-one error in loop ***

    Focus on what and why, not how: The subject should explain what the commit does. The body can explain why and how.

```Common Subject Line Prefixes (Categorization)```

Using prefixes helps categorize your commits and provides immediate context. Be consistent within your project.

-    ```feat: (Feature):``` A new feature.

        Example: feat: Add user authentication system

-    ```fix: (Bug Fix):``` A bug fix.

-        Example: fix: Resolve infinite loop in login process

-    ```docs: (Documentation):``` Changes to documentation.

        Example: docs: Update README with installation instructions

-    ```style: (Code Style):``` Changes that do not affect the meaning of the code (whitespace, formatting, missing semicolons, etc.).

        Example: style: Format code according to Prettier rules

-    ```refactor:``` (Refactoring): A code change that neither fixes a bug nor adds a feature.

        Example: refactor: Extract user validation to separate module

-    ```perf: (Performance):``` A code change that improves performance.

        Example: perf: Optimize database queries for faster loading

-    ```test: (Tests):``` Adding missing tests or correcting existing tests.

        Example: test: Add unit tests for API endpoints

-    ```build: (Build System):``` Changes that affect the build system or external dependencies (e.g., gulp, broccli, npm).

        Example: build: Upgrade webpack to version 5

    ```ci: (Continuous Integration):``` Changes to CI configuration files and scripts (e.g., Travis, Circle, GitLab CI).

        Example: ci: Add E2E tests to CI pipeline

-    ```chore: (Chores/Maintenance):``` Other changes that don't modify src or test files.

        Example: chore: Update gitignore with new temp files

-    ```revert: (Reverts):``` Reverts a previous commit.
        Example: revert: feat: Add experimental caching mechanism

3. The Body (Optional but Recommended)

The commit body provides additional context and explanation.

    - Explain why the change was made: What problem does this commit solve? What was the motivation behind the change?

    - Explain how it was done (briefly): If the implementation is complex or has significant implications, provide a high-level overview. Avoid diving into line-by-line code explanations.

    - Detail trade-offs or alternatives: If you considered different approaches, mention why you chose this particular one.

    - Reference related issues/PRs: Link to issue trackers (e.g., Fixes #123, Closes #456) or pull requests. This helps automate issue closing and provides traceability.

    - Wrap lines at 72 characters: This improves readability in git log and other tools.

    - Use bullet points for lists: If you have multiple distinct points to make, use hyphens or asterisks for readability.

```Example of a Good Commit Message```

- feat: Implement user profile editing functionality

This commit introduces the ability for authenticated users to
edit their profile information, including name, email, and
password.

Previously, users could only view their profiles. This feature
addresses issue #789, allowing for greater user control and
data accuracy.

The implementation includes:
- A new API endpoint for profile updates (`/api/users/:id/profile`).
- Client-side form validation for all input fields.
- Integration with the existing authentication middleware to
  ensure only authorized users can modify their own profiles.

Considered a single-page update but opted for separate password
change for security reasons.

```4. Atomic Commits: Do One Thing and Do It Well```

    Each commit should represent a single logical change. Avoid mixing multiple unrelated changes (e.g., fixing a bug, adding a feature, and refactoring unrelated code in one commit).

    If you're unsure, ask yourself: "Can this commit be reverted independently without affecting other desired changes?" If not, consider splitting it.

    Smaller, focused commits are easier to understand, review, and revert if necessary.

```5. Be Consistent```

    Follow the project's existing commit message style. If there's no established style, discuss and agree on one with your team.

    Consistency makes the commit history easier to parse for everyone involved.

```6. Review Your Commits```

    Before pushing, always review your commits using git log, git diff HEAD~1, or a Git GUI tool.

    Read your commit message as if you were another developer (or your future self) trying to understand the change. Is it clear? Is it complete?

```7. Use Interactive Rebase for Cleaning Up History```

    Sometimes, your local commits might be messy. Before pushing to a shared branch, use git rebase -i to:

        Squash related commits into a single, more meaningful one.

        Reorder commits.

        Edit commit messages.

        Fixup small changes into previous commits.

    Caution: Never rebase commits that have already been pushed to a shared remote branch, as this rewrites history and can cause issues for collaborators.

```Practical Tools and Tips```

    Git Hooks: You can set up client-side Git hooks (e.g., commit-msg hook) to automatically enforce commit message guidelines.

    Commitizen: A command-line utility that helps you conform to a specific commit message convention.

    Linters: Tools like commitlint can validate your commit messages against predefined rules.

    IDE Integrations: Many IDEs (VS Code, IntelliJ) have extensions that assist with writing good commit messages.
