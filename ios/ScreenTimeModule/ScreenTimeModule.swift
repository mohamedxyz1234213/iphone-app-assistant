import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {

  private let store = ManagedSettingsStore()
  private let center = AuthorizationCenter.shared

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await center.requestAuthorization(for: .individual)
        resolve(true)
      } catch {
        reject("AUTH_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc
  func blockApps(_ bundleIds: [String],
                 resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    // FamilyControls does not allow constructing ApplicationToken objects directly
    // from bundle IDs — tokens must be acquired through the FamilyActivityPicker SwiftUI
    // component (see ScreenTimePicker.swift). The selected tokens are then stored and
    // used here via store.shield.applications.
    //
    // When bundle IDs are provided without prior picker selection, we fall back to
    // shielding by category (socialNetworking + entertainment). In the full integration,
    // the React Native side passes a serialized token set obtained from the picker.
    if !bundleIds.isEmpty {
      store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(
        [.socialNetworking, .entertainment],
        except: Set()
      )
    } else {
      store.shield.applications = nil
    }
    resolve(true)
  }

  @objc
  func unblockApps(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomainCategories = nil
    resolve(true)
  }

  @objc
  func blockAllSocialMedia(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(
      [.socialNetworking, .entertainment, .games],
      except: Set()
    )
    resolve(true)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { return false }

  @objc
  static func moduleName() -> String! { return "ScreenTimeModule" }
}
