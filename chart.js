
// ==========================================
// ATTENDTRACK - WEEKLY ATTENDANCE CHART
// ==========================================

const DASHBOARD_API_URL = "http://localhost:5035/api";

document.addEventListener("DOMContentLoaded", function () {

    const chartCanvas = document.getElementById("attendanceChart");
    const dashboardMessage = document.getElementById("dashboardMessage");

    if (!chartCanvas) return;

    let attendanceChart = null;

    async function loadAttendanceChart() {

        try {

            // FETCH ATTENDANCE DATA FROM API
            const response = await apiFetch(`${DASHBOARD_API_URL}/Attendance`);

            if (!response.ok) {
                throw new Error("Unable to load attendance records.");
            }

            const attendance = await response.json();

            // GET CURRENT WEEK (MONDAY TO FRIDAY)
            const today = new Date();
            const day = today.getDay();

            const monday = new Date(today);
            monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
            monday.setHours(0, 0, 0, 0);

            // WEEKDAY LABELS
            const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

            const presentData = [0, 0, 0, 0, 0];
            const absentData = [0, 0, 0, 0, 0];
            const lateData = [0, 0, 0, 0, 0];

            // GROUP RECORDS BY WEEKDAY
            attendance.forEach(record => {

                if (!record.attendanceDate) return;

                const dateParts = String(record.attendanceDate)
                    .substring(0, 10)
                    .split("-")
                    .map(Number);

                const recordDate = new Date(
                    dateParts[0],
                    dateParts[1] - 1,
                    dateParts[2]
                );

                const difference = Math.round(
                    (recordDate - monday) / (1000 * 60 * 60 * 24)
                );

                // ONLY MONDAY TO FRIDAY OF CURRENT WEEK
                if (difference < 0 || difference > 4) return;

                const status = record.status?.toLowerCase();

                if (status === "present") {
                    presentData[difference]++;
                } else if (status === "absent") {
                    absentData[difference]++;
                } else if (status === "late") {
                    lateData[difference]++;
                }

            });

            // DESTROY OLD CHART
            if (attendanceChart) {
                attendanceChart.destroy();
            }

            // CREATE WEEKLY ATTENDANCE CHART
            attendanceChart = new Chart(chartCanvas, {

                type: "bar",

                data: {
                    labels: labels,

                    datasets: [

                        {
                            label: "Present",
                            data: presentData,
                            backgroundColor: "#4f91f7",
                            borderRadius: 6
                        },

                        {
                            label: "Absent",
                            data: absentData,
                            backgroundColor: "#65c486",
                            borderRadius: 6
                        },

                        {
                            label: "Late",
                            data: lateData,
                            backgroundColor: "#f28b54",
                            borderRadius: 6
                        }

                    ]
                },

                options: {

                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            position: "bottom",

                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },

                        tooltip: {
                            enabled: true
                        }

                    },

                    scales: {

                        x: {
                            grid: {
                                display: false
                            }
                        },

                        y: {
                            beginAtZero: true,

                            ticks: {
                                precision: 0,
                                stepSize: 1
                            }
                        }

                    }

                }

            });

            if (dashboardMessage) {
                dashboardMessage.textContent =
                    "Showing attendance records from Monday to Friday this week.";
            }

            console.log("Weekly attendance chart loaded successfully.");

        } catch (error) {

            console.error("Attendance chart error:", error);

            if (dashboardMessage) {
                dashboardMessage.textContent =
                    "Unable to load attendance chart. Please check the API.";
            }

        }

    }

    // CHECK CHART.JS LIBRARY
    if (typeof Chart === "undefined") {

        console.error("Chart.js library is not loaded.");

        if (dashboardMessage) {
            dashboardMessage.textContent =
                "Chart library not found. Please check your script links.";
        }

        return;
    }

    loadAttendanceChart();

});
