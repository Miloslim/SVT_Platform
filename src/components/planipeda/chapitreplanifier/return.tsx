return (
  <div className="w-full p-6 bg-gray-100 min-h-screen font-inter">

    {/* === Titre Principal === */}
    <header className="mb-8 text-center">
      <h1 className="text-3xl font-extrabold text-gray-900">
        Composer une Fiche de Planification de Chapitre
      </h1>
    </header>

    {/* === Bloc Paramètres de la fiche === */}
    <div className="bg-white shadow-xl rounded-lg p-6 mb-6 border border-gray-200">
      {/* --- Sélection du chapitre de référence --- */}
      <ChapterPlanningHeader
        chapitreReferenceId={chapitre.chapitreReferenceId}
        niveauId={chapitre.niveauId}
        optionId={chapitre.optionId}
        uniteId={chapitre.uniteId}
        titreChapitre={chapitre.titreChapitre}
        objectifsGeneraux={chapitre.objectifsGeneraux}
        nomFichePlanification={chapitre.nomFichePlanification}
        statutFiche={chapitre.statut}
        onTargetSelectionChange={handleTargetSelectionChange}
        onUpdateChapitreDetails={handleUpdateChapitreDetails}
      />

      {/* --- Zone édition Nom + Statut + Bouton Sauvegarde --- */}
      <div className="mt-6 p-4 rounded-md bg-white shadow border-l-4 border-indigo-500 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
          {/* --- Champ: Nom de la fiche --- */}
          <div className="flex flex-col w-[32rem]">
            <label htmlFor="nomFiche" className="text-sm font-medium text-gray-700">
              Nom de la fiche
            </label>
            <input
              type="text"
              id="nomFiche"
              value={chapitre.nomFichePlanification}
              onChange={(e) =>
                setChapitre((prev) => ({ ...prev, nomFichePlanification: e.target.value }))
              }
              placeholder="Titre de la fiche"
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>

          {/* --- Champ: Statut --- */}
          <div className="flex flex-col">
            <label htmlFor="statut" className="text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              id="statut"
              value={chapitre.statut}
              onChange={(e) =>
                setChapitre((prev) => ({ ...prev, statut: e.target.value }))
              }
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Brouillon">Brouillon</option>
              <option value="Finalisé">Finalisé</option>
              <option value="Archivé">Archivé</option>
            </select>
          </div>
        </div>

        {/* --- Bouton Sauvegarde --- */}
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-150 ease-in-out self-end md:self-auto"
        >
          Enregistrer le Chapitre
        </button>
      </div>
    </div>

    {/* === Grille Principale === */}
    <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_2.4fr_0.8fr] gap-6">

      {/* --- Colonne Gauche : Ajout d’éléments --- */}
      <aside className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-fit sticky top-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">
          Ajouter un élément
        </h2>
        <div className="flex flex-col space-y-4">
          <button onClick={handleOpenSequenceSelector} className="btn-blue">+ Séquence</button>
          <button onClick={handleOpenActivitySelector} className="btn-green">+ Activité</button>
          <button onClick={handleOpenEvaluationSelector} className="btn-purple">+ Évaluation</button>
        </div>
      </aside>

      {/* --- Colonne Centrale : Détail de l’élément sélectionné --- */}
      <section className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">
          Détails de l'Élément Sélectionné
        </h2>
        {selectedProgressionItem ? (
          <>
            {selectedProgressionItem.type === 'sequence' && (
              <SequenceBlock {...} />
            )}
            {selectedProgressionItem.type === 'activity' && (
              <ActivityBlock {...} />
            )}
            {selectedProgressionItem.type === 'evaluation' && (
              <EvaluationBlock {...} />
            )}
          </>
        ) : (
          <div className="text-center text-gray-500">
            Sélectionnez un élément dans la progression à droite pour voir ses détails ici.
          </div>
        )}
      </section>

      {/* --- Colonne Droite : Liste de la progression --- */}
      <aside className="col-span-1 bg-white p-6 rounded-lg shadow-lg border border-gray-200 min-w-[300px] lg:min-w-[400px]">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Progression du Chapitre
        </h2>
        {chapitre.progressionItems.length === 0 ? (
          <p className="text-gray-600 text-center p-4 border border-dashed rounded-md bg-gray-50">
            Aucun élément dans la progression. Ajoutez-en un !
          </p>
        ) : (
          <div className="overflow-auto max-h-[600px] rounded-lg border border-gray-100 mt-4">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <tbody>
                <SortableList
                  items={chapitre.progressionItems}
                  selectedItemId={selectedProgressionItem?.id}
                  onSelectItem={handleSelectItem}
                  onRemove={handleRemoveProgressionItem}
                  onReorder={handleReorderProgression}
                />
              </tbody>
            </table>
          </div>
        )}
      </aside>
    </div>

    {/* === Overlay de chargement === */}
    {isSavingOrLoading && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-700">Enregistrement en cours...</p>
        </div>
      </div>
    )}

    {/* === Modales de sélection (activités, évaluations, séquences) === */}
    <CustomModal isOpen={showActivitySelectorModal} onClose={() => setShowActivitySelectorModal(false)} title="Sélectionner une Activité existante">
      <ActivitySelector {...} />
      <div className="flex justify-center mt-4 text-gray-600 text-sm">
        Pour créer une nouvelle activité, utilisez le tableau de bord des activités.
      </div>
    </CustomModal>

    <CustomModal isOpen={showEvaluationSelectorModal} onClose={() => setShowEvaluationSelectorModal(false)} title="Sélectionner une Évaluation existante">
      <EvaluationSelector {...} />
      <div className="flex justify-center mt-4 text-gray-600 text-sm">
        Pour créer une nouvelle évaluation, utilisez le tableau de bord des évaluations.
      </div>
    </CustomModal>

    <CustomModal isOpen={showSequenceSelectorModal} onClose={() => setShowSequenceSelectorModal(false)} title="Sélectionner une Séquence existante">
      <SequenceSelector {...} />
      <div className="flex justify-center mt-4 text-gray-600 text-sm">
        Pour créer une nouvelle séquence, utilisez le tableau de bord des séquences.
      </div>
    </CustomModal>

    {/* === Modales d’édition des entités maîtres === */}
    <CustomModal isOpen={showEditActivityModal} onClose={handleMasterActivitySaved} title="Modifier l'Activité Maître">
      {editingMasterActivityId && (
        <EditActivityForm {...} />
      )}
    </CustomModal>

    <CustomModal isOpen={showEditEvaluationModal} onClose={handleMasterEvaluationSaved} title="Modifier l'Évaluation Maître">
      {editingMasterEvaluationId && (
        <EditEvaluationForm {...} />
      )}
    </CustomModal>

    <CustomModal isOpen={showEditSequenceModal} onClose={handleMasterSequenceSaved} title="Modifier la Séquence Maître">
      {editingMasterSequenceId && (
        <EditSequenceForm {...} />
      )}
    </CustomModal>

    {/* === Boutons style JSX === */}
    <style jsx>{`
      .btn-blue {
        background-color: #2563eb;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: background-color 0.2s ease;
      }
      .btn-blue:hover {
        background-color: #1d4ed8;
      }
      .btn-green {
        background-color: #16a34a;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: background-color 0.2s ease;
      }
      .btn-green:hover {
        background-color: #15803d;
      }
      .btn-purple {
        background-color: #9333ea;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: background-color 0.2s ease;
      }
      .btn-purple:hover {
        background-color: #7e22ce;
      }
    `}</style>
  </div>
);
