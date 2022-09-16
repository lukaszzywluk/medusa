import { Image } from "../models"
import { dataSource } from "../loaders/database"

export const ImageRepository = dataSource.getRepository(Image).extend({
  async upsertImages(imageUrls: string[]) {
    const imgToUpsert = imageUrls.map((imgUrl) => {
      return { url: imgUrl }
    })
    return await this.upsert(imgToUpsert, {
      conflictPaths: ["url"],
      skipUpdateIfNoValuesChanged: true,
    })
  },
})
