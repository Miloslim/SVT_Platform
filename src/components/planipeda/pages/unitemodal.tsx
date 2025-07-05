  {/* Modale d’ajout */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogTrigger asChild>
          <Button>Ajouter une Unité</Button>
        </DialogTrigger>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">➕ Nouvelle Unité</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label>Niveau</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedNiveau ?? ""}
                onChange={(e) => {
                  const id = e.target.value === "" ? null : Number(e.target.value);
                  setSelectedNiveau(id);
                  setSelectedOption(null);
                }}
              >
                <option value="">Sélectionner un niveau</option>
                {niveaux.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nom_niveau}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Option</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedOption ?? ""}
                onChange={(e) => setSelectedOption(Number(e.target.value))}
                disabled={!selectedNiveau}
              >
                <option value="">Sélectionner une option</option>
                {options
                  .filter((o) => selectedNiveau === null || o.niveau_id === selectedNiveau)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nom_option}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label>Titre de l’unité</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                value={titreUnite}
                onChange={(e) => setTitreUnite(e.target.value)}
                placeholder="Ex: Unité 1 - Introduction"
              />
            </div>

            <Button onClick={handleAddUnite}>Ajouter</Button>
          </div>
        </DialogContent>
      </Dialog>
