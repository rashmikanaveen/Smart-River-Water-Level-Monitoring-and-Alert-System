import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button"; // Adjust import path if needed

interface AddUnitProps {
  onAdd: (unitId: string, name?: string) => void;
}

const AddUnit: React.FC<AddUnitProps> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId.trim()) return;
    onAdd(unitId.trim(), name.trim() || undefined);
    setUnitId("");
    setName("");
    setOpen(false);
  };

  return (
    <>
      <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
        <Button  onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Unit
        </Button>
      </div>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto">
          {/* Modal box only, no dark overlay */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Add New Unit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Unit ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitId}
                  onChange={e => setUnitId(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter Unit ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter Name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddUnit;