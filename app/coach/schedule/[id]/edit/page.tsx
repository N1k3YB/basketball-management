"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import RoleProtectedLayout from "@/components/layout/RoleProtectedLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function EditTrainingPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [trainingData, setTrainingData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endTime: "",
    location: "",
    selectedTeamIds: [] as string[],
    status: "SCHEDULED",
  });
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    // Загрузка команд тренера
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/coach/teams");
        if (!response.ok) throw new Error("Не удалось загрузить список команд");
        const data = await response.json();
        setTeams(data);
      } catch (e) {
        setError("Не удалось загрузить список команд. Попробуйте позже.");
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    // Загрузка данных тренировки
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error("Не удалось загрузить данные тренировки");
        const data = await response.json();
        if (data.eventType !== "TRAINING") throw new Error("Можно редактировать только тренировки");
        // Форматирование даты и времени для инпутов
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        setTrainingData({
          title: data.title || "",
          description: data.description || "",
          startDate: start.toISOString().slice(0, 10),
          startTime: start.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
          location: data.location || "",
          selectedTeamIds: data.teams ? data.teams.map((t: any) => t.id) : [],
          status: data.status || "SCHEDULED",
        });
        setInitialLoaded(true);
      } catch (e: any) {
        setError(e.message || "Не удалось загрузить данные тренировки");
      } finally {
        setIsLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  const validateDateTime = (startDate: string, startTime: string, endTime: string): boolean => {
    if (!startDate || !startTime || !endTime) return false;
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);
    return endDateTime > startDateTime;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!trainingData.title.trim()) errors.title = "Название обязательно";
    else if (trainingData.title.trim().length < 3) errors.title = "Минимум 3 символа";
    if (!trainingData.location.trim()) errors.location = "Место обязательно";
    if (!trainingData.startDate) errors.startDate = "Дата обязательна";
    if (!trainingData.startTime) errors.startTime = "Время начала обязательно";
    if (!trainingData.endTime) errors.endTime = "Время окончания обязательно";
    if (trainingData.startDate && trainingData.startTime && trainingData.endTime) {
      if (!validateDateTime(trainingData.startDate, trainingData.startTime, trainingData.endTime)) {
        errors.dateTime = "Время окончания должно быть позже начала";
      }
    }
    if (trainingData.selectedTeamIds.length === 0 && teams.length > 0) errors.teams = "Выберите хотя бы одну команду";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTrainingData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "", dateTime: "" }));
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
    setTrainingData((prev) => ({ ...prev, selectedTeamIds: selectedOptions }));
    setValidationErrors((prev) => ({ ...prev, teams: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError(null);
    try {
      const startDateTime = new Date(`${trainingData.startDate}T${trainingData.startTime}`);
      const endDateTime = new Date(`${trainingData.startDate}T${trainingData.endTime}`);
      const requestData = {
        title: trainingData.title,
        description: trainingData.description,
        eventType: "TRAINING",
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: trainingData.location,
        teamIds: trainingData.selectedTeamIds,
        status: trainingData.status,
      };
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Не удалось сохранить тренировку");
      }
      router.push("/coach/schedule");
    } catch (e: any) {
      setError(e.message || "Не удалось сохранить тренировку");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleProtectedLayout allowedRoles={["COACH"]}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Редактирование тренировки</h1>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full p-0"
          >
            <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Button>
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Данные тренировки</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
            )}
            {validationErrors.dateTime && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{validationErrors.dateTime}</div>
            )}
            {!initialLoaded ? (
              <div className="py-8 text-center text-gray-500">Загрузка...</div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название тренировки *</label>
                  <Input
                    name="title"
                    value={trainingData.title}
                    onChange={handleChange}
                    required
                    className={validationErrors.title ? "border-red-500" : ""}
                  />
                  {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <textarea
                    name="description"
                    value={trainingData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Статус события *</label>
                  <select
                    name="status"
                    value={trainingData.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="SCHEDULED">Запланировано</option>
                    <option value="COMPLETED">Завершено</option>
                    <option value="CANCELLED">Отменено</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата *</label>
                  <Input
                    type="date"
                    name="startDate"
                    value={trainingData.startDate}
                    onChange={handleChange}
                    required
                    className={validationErrors.startDate ? "border-red-500" : ""}
                  />
                  {validationErrors.startDate && <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Время начала *</label>
                  <Input
                    type="time"
                    name="startTime"
                    value={trainingData.startTime}
                    onChange={handleChange}
                    required
                    className={validationErrors.startTime ? "border-red-500" : ""}
                  />
                  {validationErrors.startTime && <p className="text-red-500 text-xs mt-1">{validationErrors.startTime}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Время окончания *</label>
                <Input
                  type="time"
                  name="endTime"
                  value={trainingData.endTime}
                  onChange={handleChange}
                  required
                  className={validationErrors.endTime ? "border-red-500" : ""}
                />
                {validationErrors.endTime && <p className="text-red-500 text-xs mt-1">{validationErrors.endTime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Место проведения *</label>
                <Input
                  name="location"
                  value={trainingData.location}
                  onChange={handleChange}
                  required
                  className={validationErrors.location ? "border-red-500" : ""}
                />
                {validationErrors.location && <p className="text-red-500 text-xs mt-1">{validationErrors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Команды *</label>
                <select
                  multiple
                  name="selectedTeams"
                  value={trainingData.selectedTeamIds}
                  onChange={handleTeamChange}
                  className={`w-full p-2 border ${validationErrors.teams ? "border-red-500" : "border-gray-300"} rounded-md h-48`}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Удерживайте Ctrl (Cmd на Mac) для выбора нескольких команд</p>
                {validationErrors.teams && <p className="text-red-500 text-xs mt-1">{validationErrors.teams}</p>}
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleProtectedLayout>
  );
} 