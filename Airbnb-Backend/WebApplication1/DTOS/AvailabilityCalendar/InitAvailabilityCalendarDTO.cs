namespace WebApplication1.DTOS.AvailabilityCalendar
{
    public class InitAvailabilityCalendarDTO
    {
        public int MonthsAhead { get; set; } = 2;
        public bool IsAvailable { get; set; } = true;
    }
}
