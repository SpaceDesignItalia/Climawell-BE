const createSocketServer = require("../../socket");

class NotifyMiddleware {
  static async MessageNotification(db, ConversationId, StafferSenderId, Text) {
    try {
      // Prima query: inserimento nella tabella Notification
      let query = `INSERT INTO public."Notification" ("NotificationMessage", "NotificationCreationDate") VALUES ($1, $2) RETURNING "NotificationId"`;
      const notificationResult = await db.query(query, [Text, new Date()]);
      const NotificationId = notificationResult.rows[0].NotificationId;

      // Seconda query: recupero dati dalla tabella Conversation
      query = `SELECT "Staffer1Id", "Staffer2Id", "ProjectId" FROM public."Conversation" WHERE "ConversationId" = $1`;
      const conversationResult = await db.query(query, [ConversationId]);
      const { Staffer1Id, Staffer2Id, ProjectId } = conversationResult.rows[0];

      // Determina il destinatario della notifica
      let userId = Staffer1Id;
      if (StafferSenderId === Staffer1Id) {
        userId = Staffer2Id;
      }

      let notificationExtraDataQuery;

      if (ProjectId) {
        query = `SELECT "StafferId" FROM public."ProjectTeam" WHERE "ProjectId" = $1 AND "StafferId" != $2`;
        const ProjectTeam = await db.query(query, [ProjectId, StafferSenderId]);
        ProjectTeam.rows.forEach(async (projectStaffer) => {
          if (projectStaffer.StafferId !== userId) {
            query = `INSERT INTO public."NotificationExtraData" ("NotificationId", "UserId", "IsRead") VALUES ($1, $2, $3)`;
            notificationExtraDataQuery = await db.query(query, [
              NotificationId,
              projectStaffer.StafferId,
              false,
            ]);
          }
        });
      } else {
        // Prepara le query successive
        query = `INSERT INTO public."NotificationExtraData" ("NotificationId", "UserId", "IsRead") VALUES ($1, $2, $3)`;
        notificationExtraDataQuery = db.query(query, [
          NotificationId,
          userId,
          false,
        ]);
      }

      const NotificationTypeName = ProjectId ? "Progetto" : "Dipendente";
      query = `INSERT INTO public."NotificationInfo" ("NotificationId", "ProjectId", "StafferId", "NotificationTypeName") VALUES ($1, $2, $3, $4)`;
      const notificationInfoQuery = db.query(query, [
        NotificationId,
        ProjectId,
        StafferSenderId,
        NotificationTypeName,
      ]);

      // Esegui tutte le query in parallelo
      await Promise.all([notificationExtraDataQuery, notificationInfoQuery]);
      createSocketServer.sendNotification(userId); // Invia la notifica al destinatario
      // Risolvi la promessa finale
      return { success: true };
    } catch (error) {
      // Gestione degli errori
      throw error;
    }
  }

  static async ProjectNotification(db, UserId, ProjectId, Text) {
    try {
      // Prima query: inserimento nella tabella Notification
      let query = `INSERT INTO public."Notification" ("NotificationMessage", "NotificationCreationDate") VALUES ($1, $2) RETURNING "NotificationId"`;
      const notificationResult = await db.query(query, [Text, new Date()]);
      const NotificationId = notificationResult.rows[0].NotificationId;

      let notificationExtraDataQuery;

      query = `SELECT "StafferId" FROM public."ProjectTeam" WHERE "ProjectId" = $1 AND "StafferId" != $2`;
      const ProjectTeam = await db.query(query, [ProjectId, UserId]);
      ProjectTeam.rows.forEach(async (projectStaffer) => {
        if (projectStaffer.StafferId !== UserId) {
          query = `INSERT INTO public."NotificationExtraData" ("NotificationId", "UserId", "IsRead") VALUES ($1, $2, $3)`;
          notificationExtraDataQuery = await db.query(query, [
            NotificationId,
            projectStaffer.StafferId,
            false,
          ]);
        }
      });

      const NotificationTypeName = "Progetto";
      query = `INSERT INTO public."NotificationInfo" ("NotificationId", "ProjectId", "NotificationTypeName") VALUES ($1, $2, $3)`;
      const notificationInfoQuery = db.query(query, [
        NotificationId,
        ProjectId,
        NotificationTypeName,
      ]);

      // Esegui tutte le query in parallelo
      await Promise.all([notificationExtraDataQuery, notificationInfoQuery]);
      createSocketServer.sendNotification(UserId); // Invia la notifica al destinatario
      // Risolvi la promessa finale
      return { success: true };
    } catch (error) {
      // Gestione degli errori
      throw error;
    }
  }
}

module.exports = NotifyMiddleware;
